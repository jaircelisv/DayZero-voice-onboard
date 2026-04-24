import { Request, Response } from "express";
import pino from "pino";
import { z } from "zod";
import Stripe from "stripe";
import Redis from "ioredis";
import { buildCitedMdEntry } from "../lib/cited";

const log = pino({ name: "create-order" });

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TG_OWNER = process.env.TELEGRAM_OWNER_CHAT_ID ?? "";

if (STRIPE_KEY && !STRIPE_KEY.startsWith("sk_test_")) {
  log.error("STRIPE_SECRET_KEY is NOT a test key — refusing to load");
  throw new Error("STRIPE_SECRET_KEY must start with sk_test_");
}

const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: "2024-09-30.acacia" as Stripe.LatestApiVersion }) : null;
const rawRedis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const OrderSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  customerName: z.string().min(1),
  customerPhone: z.string().optional().default(""),
  scheduledAt: z.string().min(1),
  depositCents: z.number().int().positive(),
  currency: z.enum(["usd", "cop", "mxn"]).default("usd"),
});

export async function createOrder(req: Request, res: Response) {
  const agentId = req.params.agentId ?? "default";
  const parsed = OrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "bad_input", details: parsed.error.format() });
  }
  const order = parsed.data;
  const orderId = `ord_${Math.random().toString(36).slice(2, 10)}`;

  log.info({ agentId, orderId, product: order.product }, "createOrder fanout");

  async function createStripeLink(): Promise<{ url: string; id: string }> {
    if (!stripe) return { url: "https://buy.stripe.com/test_NOT_CONFIGURED", id: "dummy" };
    const price = await stripe.prices.create({
      currency: order.currency,
      unit_amount: order.depositCents,
      product_data: { name: `${order.product} (${order.quantity}x)` },
    });
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    });
    return { url: link.url, id: link.id };
  }
  const stripeCall = createStripeLink();

  const tgText = `🍞 Nuevo pedido — ${order.customerName}, ${order.quantity}x ${order.product}, ${order.scheduledAt}. Seña $${(order.depositCents / 100).toFixed(2)} ${order.currency.toUpperCase()} cobrada.`;
  const telegramCall =
    TG_TOKEN && TG_OWNER
      ? fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: TG_OWNER, text: tgText }),
        }).then((r) => r.json())
      : Promise.resolve({ ok: false, description: "telegram_not_configured" });

  const [stripeResult, telegramResult] = await Promise.all([stripeCall, telegramCall]).catch(
    (err) => {
      log.error({ err }, "fanout failed");
      throw err;
    },
  );

  const paymentLink = stripeResult.url;
  const stripeId = stripeResult.id;
  const tgRes = telegramResult as { ok?: boolean; result?: { message_id?: number } };
  const telegramMessageId = tgRes.ok ? tgRes.result?.message_id : null;

  // Send the payment link in a 2nd Telegram message so it's clickable
  if (TG_TOKEN && TG_OWNER && paymentLink) {
    fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_OWNER,
        text: `💳 Link de pago para el cliente:\n${paymentLink}`,
      }),
    }).catch((err) => log.warn({ err }, "telegram link msg failed"));
  }

  const citedMdEntry = buildCitedMdEntry({
    action: "order_created",
    sessionId: agentId,
    reasoning: `Agent for ${agentId} processed an order from ${order.customerName} for ${order.quantity}x ${order.product}, scheduled ${order.scheduledAt}. Deposit charged via Stripe; owner notified via Telegram.`,
    sources: [
      { type: "stripe_payment_link", ref: stripeId, url: paymentLink },
      { type: "telegram_message", ref: String(telegramMessageId ?? "n/a") },
      { type: "scheduled_at", value: order.scheduledAt },
    ],
  });

  if (rawRedis) {
    try {
      await rawRedis.hset(`order:${orderId}`, {
        agentId,
        orderId,
        product: order.product,
        quantity: String(order.quantity),
        customerName: order.customerName,
        scheduledAt: order.scheduledAt,
        depositCents: String(order.depositCents),
        currency: order.currency,
        paymentLink,
        stripeId,
        telegramMessageId: String(telegramMessageId ?? ""),
        citedMdEntry,
        createdAt: String(Date.now()),
      });
      await rawRedis.expire(`order:${orderId}`, 60 * 60 * 24);
      await rawRedis.publish(
        "dayzero:events",
        JSON.stringify({ kind: "order_created", agentId, orderId, paymentLink, telegramMessageId }),
      );
    } catch (err) {
      log.warn({ err }, "redis persist failed");
    }
  }

  return res.json({
    orderId,
    paymentLink,
    stripeId,
    telegramMessageId,
    scheduledAt: order.scheduledAt,
    citedMdEntry,
  });
}
