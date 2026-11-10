import os from 'os';
import messagingDispatchService from '../services/messagingDispatchService.js';
import outboxService from '../services/outboxService.js';

let timer = null;
let running = false;

const workerId = `${os.hostname()}:${process.pid}`;

function retryAt(attemptCount) {
  const delayMinutes = Math.min(60, 2 ** Math.max(0, attemptCount - 1));
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

export async function processOutboxEvent(event) {
  const payload = JSON.parse(event.PayloadJson);

  if (event.EventType === 'policy.activated') {
    return messagingDispatchService.dispatchPolicyActivated(payload);
  }
  if (event.EventType === 'message.sms_fallback.requested') {
    return messagingDispatchService.dispatchSmsFallback(payload);
  }

  throw new Error(`Unsupported Outbox event type: ${event.EventType}`);
}

export async function runOutboxOnce() {
  if (running) return { skipped: true };
  running = true;

  try {
    const event = await outboxService.claimNext(workerId);
    if (!event) return { processed: 0 };

    try {
      await processOutboxEvent(event);
      await outboxService.markProcessed(event.OutboxEventID);
      return { processed: 1, eventType: event.EventType };
    } catch (error) {
      const deadLetter = event.AttemptCount >= 5;
      await outboxService.markFailed(event.OutboxEventID, error, {
        availableAt: deadLetter ? null : retryAt(event.AttemptCount),
        deadLetter,
      });
      return { processed: 0, failed: 1, deadLetter, error: error.message };
    }
  } catch (error) {
    console.error('[outbox] worker error:', error.message);
    return { processed: 0, error: error.message };
  } finally {
    running = false;
  }
}

export function startOutboxWorker() {
  if (process.env.OUTBOX_WORKER_ENABLED !== 'true') return null;
  if (timer) return timer;

  const intervalMs = Math.max(1000, Number(process.env.OUTBOX_WORKER_INTERVAL_MS || 5000));
  console.log(`[outbox] enabled, interval ${intervalMs} ms`);

  timer = setInterval(() => {
    runOutboxOnce();
  }, intervalMs);
  if (timer.unref) timer.unref();
  return timer;
}

export function stopOutboxWorker() {
  if (timer) clearInterval(timer);
  timer = null;
}