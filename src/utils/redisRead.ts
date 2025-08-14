import Redis from 'ioredis';
import { getModeRedis, getRedisSlave } from './yaml';

// Kết nối đọc từ slave
const redis = new Redis({
    host: getRedisSlave()?.host,
    port: getRedisSlave()?.port,
});

export async function getCache<T = any>(key: string): Promise<T | null> {
    if (!getModeRedis()) {
        console.warn('⚠️ Redis đang bị tắt trong config');
        return null;
    }
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
}

export { redis as redisRead }