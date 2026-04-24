import { Request, Response } from "express";
import pino from "pino";
import { validateVapiSignature } from "../lib/vapi-signature";
import { store } from "../lib/redis";
import type { VapiServerEventEnvelope, VapiEndOfCallReport } from "../types/vapi";

const log = pino({ name: "webhook-vapi" });

export async function webhookVapi(req: Request, res: Response) {
  if (!validateVapiSignature(req)) {
    log.warn({ ip: req.ip }, "invalid vapi signature");
    return res.status(401).json({ error: "invalid_signature" });
  }

  const envelope = req.body as VapiServerEventEnvelope;
  const msg = envelope?.message;
  if (!msg || typeof msg !== "object" || !("type" in msg)) {
    return res.status(400).json({ error: "bad_payload" });
  }

  log.info({ type: msg.type }, "vapi event");

  switch (msg.type) {
    case "end-of-call-report": {
      const report = msg as VapiEndOfCallReport;
      const sessionId = `dz_${report.call.id}`;
      await store.create(sessionId, {
        callId: report.call.id,
        customerNumber: report.call.customer?.number ?? "",
        endedReason: report.call.endedReason ?? "",
        durationSeconds: report.durationSeconds ?? 0,
        status: "transcript_received",
      });
      if (report.transcript) {
        await store.appendTranscript(sessionId, report.transcript);
      }
      await store.publish("dayzero:events", {
        kind: "transcript_received",
        sessionId,
        transcriptLen: report.transcript?.length ?? 0,
      });

      // Fire-and-forget: kick the config generator so UI can stream YAML.
      const base = process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
      fetch(`${base}/api/generate-config`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, transcript: report.transcript ?? "" }),
      }).catch((err) => log.error({ err }, "generate-config kick failed"));

      return res.json({ ok: true, sessionId });
    }

    case "transcript":
    case "status-update":
    case "function-call":
    case "hang":
    case "speech-update":
    case "user-interrupted":
      // Acknowledge silently. Stream them later if we want live UI.
      return res.json({ ok: true });

    default:
      log.warn({ type: (msg as { type: string }).type }, "unknown vapi event");
      return res.json({ ok: true });
  }
}
