import express, { Request, Response } from "express";
import pino from "pino";
import { webhookVapi } from "./routes/webhook-vapi";
import { generateConfig } from "./routes/generate-config";
import { reserveSession } from "./routes/reserve-session";
import { createOrder } from "./routes/create-order";
import { sessionBundle } from "./routes/session-bundle";
import { latestSessionWithYaml } from "./routes/latest-session";

const log = pino({
  transport: process.env.NODE_ENV === "production"
    ? undefined
    : { target: "pino-pretty" },
});

const app = express();

// Capture raw body so we can validate x-vapi-secret / signature on webhook
app.use(
  express.json({
    limit: "5mb",
    verify: (req: Request, _res, buf) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "dayzero-backend", ts: Date.now() });
});

app.post("/webhook/vapi/onboard-transcript", webhookVapi);
app.post("/api/generate-config", generateConfig);
app.post("/api/sessions/reserve", reserveSession);
app.post("/api/agent/:agentId/createOrder", createOrder);
app.get("/api/sessions/latest-with-yaml", latestSessionWithYaml);
app.get("/api/sessions/:id/bundle", sessionBundle);

app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  log.error({ err }, "unhandled error");
  res.status(500).json({ error: "internal_error", message: err.message });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  log.info(
    { port, onboarder: process.env.VAPI_ONBOARDER_NUMBER ?? "+14433919140" },
    "dayzero backend listening",
  );
  log.info("expose with: cloudflared tunnel --url http://localhost:" + port);
});
