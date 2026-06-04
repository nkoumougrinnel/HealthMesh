import { EventEmitter } from "node:events";
import Redis from "ioredis";
import { config } from "./config.js";

// Pub/Sub abstrait : Redis si disponible, sinon EventEmitter en memoire (mono-instance).
// Permet a l'app de fonctionner pour la demo meme sans Redis installe.

let pub = null;
let sub = null;
const local = new EventEmitter();
local.setMaxListeners(0);
let usingRedis = false;

export async function initBus(logger) {
  if (!config.redisUrl) {
    logger?.info("Bus Pub/Sub : mode memoire (REDIS_URL non defini)");
    return;
  }
  try {
    const opts = { lazyConnect: true, maxRetriesPerRequest: 1, retryStrategy: () => null };
    pub = new Redis(config.redisUrl, opts);
    sub = new Redis(config.redisUrl, opts);
    // Evite les "Unhandled error event" si Redis devient injoignable apres coup.
    pub.on("error", () => {});
    sub.on("error", () => {});
    await pub.connect();
    await sub.connect();
    usingRedis = true;
    logger?.info("Bus Pub/Sub : Redis connecte");
  } catch (err) {
    usingRedis = false;
    pub = null;
    sub = null;
    logger?.warn(`Redis injoignable, bascule en Pub/Sub memoire : ${err.message}`);
  }
}

export async function publish(channel, payload) {
  const data = JSON.stringify(payload);
  if (usingRedis && pub) {
    await pub.publish(channel, data);
  } else {
    local.emit(channel, payload);
  }
}

export async function subscribe(channel, handler) {
  if (usingRedis && sub) {
    await sub.subscribe(channel);
    sub.on("message", (ch, msg) => {
      if (ch === channel) {
        try {
          handler(JSON.parse(msg));
        } catch {
          /* ignore */
        }
      }
    });
  } else {
    local.on(channel, handler);
  }
}

export function isRedisActive() {
  return usingRedis;
}

export async function closeBus() {
  try {
    await pub?.quit();
    await sub?.quit();
  } catch {
    /* ignore */
  }
}
