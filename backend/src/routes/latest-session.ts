import { Request, Response } from "express";
import pino from "pino";
import Redis from "ioredis";

const log = pino({ name: "latest-session" });
const rawRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// Returns the most recently created session that has a non-empty `yaml`.
// Used by the materializer when called without an explicit sessionId.
// Demo-grade: scans all `session:*` keys via SCAN.

export async function latestSessionWithYaml(_req: Request, res: Response) {
  if (!rawRedis) return res.status(503).json({ error: "redis_unavailable" });

  let cursor = "0";
  let best: { sessionId: string; createdAt: number } | null = null;
  let scanned = 0;

  try {
    do {
      const [next, keys] = await rawRedis.scan(cursor, "MATCH", "session:*", "COUNT", 200);
      cursor = next;
      for (const key of keys) {
        if (key.endsWith(":transcript")) continue;
        scanned++;
        const yaml = await rawRedis.hget(key, "yaml");
        if (!yaml) continue;
        const createdAt = Number(await rawRedis.hget(key, "createdAt")) || 0;
        const sessionId = key.replace(/^session:/, "");
        if (!best || createdAt > best.createdAt) {
          best = { sessionId, createdAt };
        }
      }
    } while (cursor !== "0");
  } catch (err) {
    log.error({ err }, "scan failed");
    return res.status(500).json({ error: "scan_failed" });
  }

  if (!best) {
    return res.status(404).json({ error: "no_session_with_yaml", scanned });
  }

  log.info({ sessionId: best.sessionId, createdAt: best.createdAt, scanned }, "latest session resolved");
  return res.json({ sessionId: best.sessionId, createdAt: best.createdAt });
}
