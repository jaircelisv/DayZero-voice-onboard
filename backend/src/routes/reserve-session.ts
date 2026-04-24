import { Request, Response } from "express";
import pino from "pino";
import { store } from "../lib/redis";

const log = pino({ name: "reserve-session" });
const TTL_SECONDS = 60 * 60;
const ONBOARDER_NUMBER = process.env.VAPI_ONBOARDER_NUMBER ?? "+14433919140";

export async function reserveSession(req: Request, res: Response) {
  const { devId, ipHash } = (req.body ?? {}) as {
    devId?: string;
    ipHash?: string;
  };

  const sessionId = `dz_${Math.random().toString(36).slice(2, 10)}`;
  await store.create(
    sessionId,
    {
      devId: devId ?? "anonymous",
      ipHash: ipHash ?? "",
      status: "reserved",
      createdVia: "shipables-install",
    },
    TTL_SECONDS,
  );

  log.info({ sessionId, devId: devId ?? "anonymous" }, "session reserved");

  return res.json({
    sessionId,
    onboarderNumber: ONBOARDER_NUMBER,
    expiresInSeconds: TTL_SECONDS,
    instructions: `Call ${ONBOARDER_NUMBER} and describe your business. Your session ID is ${sessionId}. The config will appear in your IDE in ~60 seconds.`,
  });
}
