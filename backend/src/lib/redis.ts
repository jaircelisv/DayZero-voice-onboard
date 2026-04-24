import Redis from "ioredis";

// G4 helpers · lives here until Gael's shared lib is extracted.
// If REDIS_URL is unset we fall back to an in-memory Map so local dev + demo
// still work without Redis Cloud.

interface SessionStore {
  create(id: string, meta: Record<string, unknown>, ttlSeconds?: number): Promise<void>;
  appendTranscript(id: string, chunk: string): Promise<void>;
  setStatus(id: string, status: string): Promise<void>;
  get(id: string): Promise<Record<string, unknown> | null>;
  publish(channel: string, payload: unknown): Promise<void>;
}

function inMemoryStore(): SessionStore {
  const map = new Map<string, Record<string, unknown>>();
  return {
    async create(id, meta, ttlSeconds) {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      map.set(id, { ...meta, transcript: "", createdAt: Date.now(), expiresAt });
    },
    async appendTranscript(id, chunk) {
      const cur = map.get(id) ?? {};
      cur.transcript = `${(cur.transcript as string) ?? ""}${chunk}`;
      map.set(id, cur);
    },
    async setStatus(id, status) {
      const cur = map.get(id) ?? {};
      cur.status = status;
      map.set(id, cur);
    },
    async get(id) {
      return map.get(id) ?? null;
    },
    async publish() {
      // no-op in memory mode
    },
  };
}

function redisStore(url: string): SessionStore {
  const client = new Redis(url);
  const pub = new Redis(url);
  return {
    async create(id, meta, ttlSeconds) {
      await client.hset(
        `session:${id}`,
        { ...meta, transcript: "", createdAt: String(Date.now()) },
      );
      await client.expire(`session:${id}`, ttlSeconds ?? 60 * 60 * 24);
    },
    async appendTranscript(id, chunk) {
      await client.hget(`session:${id}`, "transcript");
      await client.hincrbyfloat(`session:${id}`, "_touched", 1);
      await client.append(`session:${id}:transcript`, chunk);
    },
    async setStatus(id, status) {
      await client.hset(`session:${id}`, "status", status);
      await pub.publish(`session:${id}`, JSON.stringify({ status }));
    },
    async get(id) {
      const h = await client.hgetall(`session:${id}`);
      if (!h || Object.keys(h).length === 0) return null;
      const transcript = (await client.get(`session:${id}:transcript`)) ?? "";
      return { ...h, transcript };
    },
    async publish(channel, payload) {
      await pub.publish(channel, JSON.stringify(payload));
    },
  };
}

export const store: SessionStore = process.env.REDIS_URL
  ? redisStore(process.env.REDIS_URL)
  : inMemoryStore();
