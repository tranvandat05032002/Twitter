import Redis from 'ioredis';

// Kết nối đọc từ slave
const redis = new Redis({
    host: 'localhost',
    port: 6479,
});

export async function getCache<T = any>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
}

export { redis as redisRead }