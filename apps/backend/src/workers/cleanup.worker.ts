import { QueryService } from '../services/query.service.js';

// Run the sweep every 12 hours
const CLEANUP_INTERVAL_MS = 12 * 60 * 60 * 1000; 

export const startCleanupWorker = () => {
  // Execute the sweep on a repeating interval
  setInterval(async () => {
    try {
      console.log('🧹 [Cleanup Worker] Initiating routine database sweep...');
      const deletedCount = await QueryService.cleanupExpiredTokens();
      
      if (deletedCount && deletedCount > 0) {
        console.log(`✅ [Cleanup Worker] Successfully purged ${deletedCount} dead/revoked sessions.`);
      }
    } catch (error) {
      console.error('❌ [Cleanup Worker] Database sweep failed:', error);
    }
  }, CLEANUP_INTERVAL_MS);
  
  console.log('🕒 Cleanup Worker initialized (Runs every 12 hours)');
};