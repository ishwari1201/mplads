import { createClient } from 'redis';

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Limit reconnect retries to prevent log spam when running without Redis
      if (retries > 2) {
        return new Error('Redis connection retries exhausted.');
      }
      return 1000;
    },
    connectTimeout: 2000,
  },
});

let isRedisWarned = false;

redisClient.on('error', (err) => {
  if (!isRedisWarned) {
    console.warn('⚠️  Redis server not detected on port 6379 (running in memory-fallback mode).');
    isRedisWarned = true;
  }
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Redis connected successfully.');
    }
  } catch (err) {
    // Graceful offline fallback
    if (!isRedisWarned) {
      console.warn('⚠️  Redis unavailable. Backend running without cache layer.');
      isRedisWarned = true;
    }
  }
};
