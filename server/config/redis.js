import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const createRedisConnection = () => new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

export const redisClient = createRedisConnection();

redisClient.on('connect', () => {
    console.log('Redis connected');
});

redisClient.on('error', (error) => {
    console.error('Redis error:', error.message);
});

export const closeRedis = async () => {
    try {
        await redisClient.quit();
    } catch {
        await redisClient.disconnect();
    }
};
