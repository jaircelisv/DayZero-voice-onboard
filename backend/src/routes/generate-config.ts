import { Request, Response } from "express";
import pino from "pino";
import OpenAI from "openai";
import { parse as yamlParse } from "yaml";
import Redis from "ioredis";
import { store } from "../lib/redis";
import { YAML_SYSTEM_PROMPT } from "../lib/yaml-schema";

const log = pino({ name: "generate-config" });
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const rawRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

function stubYaml(sessionId: string, transcript: string): string {
  return [
    "# DayZero generated config · stub fallback",
    `agent:`,
    `  name: generated-agent-${sessionId.slice(-6)}`,
    `  displayName: Generated Agent`,
    `  description: |`,
    `    ${transcript.slice(0, 280).replace(/\n/g, " ")}`,
    `  language: es`,
    `  voice:`,
    `    provider: 11labs`,
    `    voiceId: Valentina`,
    `  tools: [createOrder, notifyOwner]`,
  ].join("\n");
}

export async function generateConfig(req: Request, res: Response) {
  const { sessionId, transcript } = (req.body ?? {}) as {
    sessionId?: string;
    transcript?: string;
  };

  if (!sessionId || !transcript) {
    return res.status(400).json({ error: "missing_fields" });
  }

  log.info({ sessionId, transcriptLen: transcript.length, model: MODEL }, "generating config");

  let yaml: string;
  let source: "openai" | "stub" = "stub";

  if (!openai) {
    log.warn({ sessionId }, "OPENAI_API_KEY not set, using stub");
    yaml = stubYaml(sessionId, transcript);
  } else {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: YAML_SYSTEM_PROMPT },
          { role: "user", content: `Transcript:\n\n${transcript}` },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      });
      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      const cleaned = raw
        .replace(/^```ya?ml\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
      yamlParse(cleaned);
      yaml = cleaned;
      source = "openai";
      log.info({ sessionId, yamlLen: yaml.length }, "yaml generated");
    } catch (err) {
      log.error({ err, sessionId }, "openai/yaml parse failed, falling back to stub");
      yaml = stubYaml(sessionId, transcript);
    }
  }

  if (rawRedis) {
    try {
      await rawRedis.hset(`session:${sessionId}`, {
        yaml,
        yamlSource: source,
        status: "config_generated",
      });
      await rawRedis.expire(`session:${sessionId}`, 60 * 60 * 24);
    } catch (err) {
      log.warn({ err, sessionId }, "redis persist failed");
    }
  }
  await store.setStatus(sessionId, "config_generated");
  await store.publish("dayzero:events", {
    kind: "config_generated",
    sessionId,
    source,
    yamlLen: yaml.length,
  });

  return res.json({ sessionId, yaml, source });
}
