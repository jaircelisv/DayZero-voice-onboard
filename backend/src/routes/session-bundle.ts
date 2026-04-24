import { Request, Response } from "express";
import pino from "pino";
import Redis from "ioredis";
import { buildCitedMdEntry } from "../lib/cited";

const log = pino({ name: "session-bundle" });
const rawRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const ONBOARDER = process.env.VAPI_ONBOARDER_NUMBER ?? "+14433919140";

export async function sessionBundle(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: "missing_id" });

  if (!rawRedis) {
    return res.status(503).json({ error: "redis_unavailable" });
  }

  let hash: Record<string, string> = {};
  try {
    hash = await rawRedis.hgetall(`session:${id}`);
  } catch (err) {
    log.warn({ err, id }, "redis read failed");
    return res.status(503).json({ error: "redis_read_failed" });
  }

  if (!hash || Object.keys(hash).length === 0) {
    return res.status(404).json({ error: "session_not_found", sessionId: id });
  }

  const yaml = hash.yaml ?? "";
  if (!yaml) {
    return res.status(202).json({
      sessionId: id,
      status: hash.status ?? "pending",
      message: "Config not generated yet. Poll again.",
    });
  }

  const transcript = (await rawRedis.get(`session:${id}:transcript`)) ?? hash.transcript ?? "";
  const callId = hash.callId ?? id.replace(/^dz_/, "");

  const citedMdEntry = buildCitedMdEntry({
    action: "agent_onboarded",
    sessionId: id,
    reasoning: "Voice transcript translated by GPT-4o-mini into a YAML config; agent ready to be deployed.",
    sources: [
      { type: "vapi_call", ref: callId },
      { type: "transcript_length", value: String(transcript.length) },
      { type: "yaml_source", value: hash.yamlSource ?? "openai" },
      { type: "onboarder_number", value: ONBOARDER },
    ],
  });

  return res.json({
    sessionId: id,
    status: "ready",
    yaml,
    yamlSource: hash.yamlSource ?? "openai",
    agentNumber: ONBOARDER,
    citedMdEntry,
    files: [
      { path: "dayzero/agent.yaml", content: yaml },
      { path: "dayzero/cited.md", content: citedMdEntry },
    ],
  });
}
