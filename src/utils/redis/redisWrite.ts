import Redis from 'ioredis';
import { getRedisMaster } from '../yaml';

// Kết nối ghi vào master
const redis = new Redis({
  host: getRedisMaster()?.host,
  port: getRedisMaster()?.port,
});

// Ghi cache
export async function setCache(key: string, value: any, ttlInSeconds?: number) {
  const json = JSON.stringify(value);
  if (ttlInSeconds) {
    await redis.set(key, json, 'EX', ttlInSeconds);
  } else {
    await redis.set(key, json);
  }
}

// Xóa cache
export async function delCache(key: string) {
  await redis.del(key);
}

// Fixed-window rate limit: k lần / window giây
export async function fixedWindowLimit(key: string, limit: number, windowSec: number) {
  const n = await redis.incr(key)
  if (n === 1) await redis.expire(key, windowSec)
  return n <= limit
}

export { redis as redisWrite };