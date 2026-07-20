import { Redis } from "@upstash/redis";

export const SESSION_TTL_SECONDS = 60 * 60 * 24;

export function isKvConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return !!url && !!token;
}

export function getRedis(): Redis {
  return Redis.fromEnv();
}

export function sessionKey(sessionId: string): string {
  return `schadeformulier:session:${sessionId}:B`;
}
