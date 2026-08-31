/**
 * Smart CV Filter — Campaign Deadline Scheduler
 * ================================================
 * Runs every hour and automatically:
 *   1. Deactivates campaigns whose deadline has passed
 *   2. (Reactivation happens via the PUT /campaigns/:id route
 *      when the HR extends the deadline to a future date)
 */

const cron     = require('node-cron');
const Campaign = require('./models/Campaign');

function startDeadlineScheduler() {
  // Run every hour at minute 0 (e.g. 01:00, 02:00 ...)
  // Change '0 * * * *' to '* * * * *' for every-minute testing
  cron.schedule('0 * * * *', async () => {
    try {
      const now    = new Date();
      const result = await Campaign.updateMany(
        {
          deadline:  { $lte: now },   // deadline has passed
          isActive:  true,            // but still marked active
        },
        {
          $set: { isActive: false }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Scheduler] Auto-closed ${result.modifiedCount} expired campaign(s) at ${now.toISOString()}`);
      }
    } catch (err) {
      console.error('[Scheduler] Error running deadline check:', err.message);
    }
  });

  // Also run ONCE at startup (catches any missed deadlines while server was down)
  (async () => {
    try {
      const now    = new Date();
      const result = await Campaign.updateMany(
        { deadline: { $lte: now }, isActive: true },
        { $set: { isActive: false } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Scheduler] Startup: auto-closed ${result.modifiedCount} expired campaign(s)`);
      }
    } catch (err) {
      console.error('[Scheduler] Startup check error:', err.message);
    }
  })();

  console.log('[Scheduler] Campaign deadline scheduler started (runs every hour)');
}

module.exports = startDeadlineScheduler;
