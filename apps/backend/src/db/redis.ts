import { createClient } from 'redis';

export const redisClient = createClient({
  url: 'redis://localhost:6380' // Matches our docker-compose port mapping
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

export const initializeRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('✅ Connected to Redis successfully.');
  }
};