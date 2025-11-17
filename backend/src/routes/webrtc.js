const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const { finalizeSession } = require('../services/sessionTerminationService');

// Store active sessions and their heartbeat status
const activeSessions = new Map();

/**
 * POST /api/webrtc-events
 * Receives events from the webRTC server
 */
router.post('/webrtc-events', async (req, res) => {
  try {
    const { type, sessionId, userRole, userAddress, timestamp, endedBy, reason } = req.body;

    console.log(`📡 WebRTC Event received:`, { type, sessionId, userRole, timestamp });

    let handlerResult = null;

    switch (type) {
      case 'user-connected':
        handleUserConnected(sessionId, userRole, timestamp);
        break;

      case 'session-heartbeat':
        handleHeartbeat(sessionId, timestamp);
        break;

      case 'session-ended':
        handlerResult = await handleSessionEnded(sessionId, endedBy, userAddress, timestamp, req.body?.session || {});
        break;

      case 'user-disconnected':
        await handleUserDisconnected(sessionId, userRole, reason, timestamp);
        break;

      default:
        console.log(`Unknown event type: ${type}`);
    }

    res.json({
      success: true,
      message: 'Event processed',
      ...(handlerResult?.summary ? { summary: handlerResult.summary } : {}),
    });
  } catch (error) {
    console.error('Error processing webRTC event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Handle user connection to webRTC session
 */
function handleUserConnected(sessionId, userRole, timestamp) {
  console.log(`✅ User connected: ${userRole} in session ${sessionId}`);

  if (!activeSessions.has(sessionId)) {
    activeSessions.set(sessionId, {
      startTime: timestamp,
      lastHeartbeat: timestamp,
      users: new Set(),
    });
  }

  activeSessions.get(sessionId).users.add(userRole);
}

/**
 * Handle heartbeat from webRTC session
 * This keeps the session alive and prevents automatic termination
 */
function handleHeartbeat(sessionId, timestamp) {
  console.log(`💓 Heartbeat for session ${sessionId}`);

  if (activeSessions.has(sessionId)) {
    activeSessions.get(sessionId).lastHeartbeat = timestamp;
  }
}

/**
 * Handle session ended by user clicking "End Call"
 * This should call endSession on the smart contract
 */
async function handleSessionEnded(sessionId, endedBy, userAddress, timestamp, extraContext = {}) {
  console.log(`🛑 Session ended by ${endedBy}: ${sessionId}`);

  const result = await finalizeSession({
    sessionId,
    initiatedBy: endedBy || userAddress,
    context: {
      userAddress,
      endedBy,
      timestamp,
      ...extraContext,
    },
  });

  if (!result?.success) {
    console.error(`Failed to finalize session ${sessionId}:`, result?.error || 'Unknown error');
    return result;
  }

  activeSessions.delete(sessionId);
  console.log(
    `✅ Session ${sessionId} finalized (duration: ${result.summary?.durationSeconds}s, cost: ${result.summary?.costFormatted} ${result.summary?.costCurrency})`
  );

  return result;
}

/**
 * Handle user disconnection (connection lost, browser closed, etc.)
 * This should also call endSession after a grace period
 */
async function handleUserDisconnected(sessionId, userRole, reason, timestamp) {
  console.log(`⚠️ User disconnected: ${userRole} from session ${sessionId}. Reason: ${reason}`);

  const session = activeSessions.get(sessionId);
  if (!session) {
    console.log(`Session ${sessionId} not found in active sessions`);
    return;
  }

  // Remove user from session
  session.users.delete(userRole);

  // If all users have disconnected, end the session after a grace period
  if (session.users.size === 0) {
    console.log(`All users disconnected from session ${sessionId}. Ending session in 30 seconds...`);

    // Wait 30 seconds to see if anyone reconnects
    setTimeout(async () => {
      const currentSession = activeSessions.get(sessionId);
      if (currentSession && currentSession.users.size === 0) {
        console.log(`Grace period expired. Ending session ${sessionId} on blockchain...`);
        try {
          await handleSessionEnded(sessionId, 'system', null, Date.now(), {
            reason: reason || 'all-users-disconnected',
            trigger: 'disconnect-grace-period',
          });
        } catch (error) {
          console.error(`Failed to end session ${sessionId} after disconnect:`, error.message);
        }
      }
    }, 30000);
  }
}

/**
 * Heartbeat monitor - checks for stale sessions
 * Runs every minute to check if any sessions haven't sent heartbeat in 2 minutes
 */
setInterval(() => {
  const now = Date.now();
  const HEARTBEAT_TIMEOUT = 2 * 60 * 1000; // 2 minutes

  for (const [sessionId, session] of activeSessions.entries()) {
    const timeSinceLastHeartbeat = now - session.lastHeartbeat;

    if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.log(`⚠️ Session ${sessionId} has stale heartbeat (${Math.floor(timeSinceLastHeartbeat / 1000)}s). Ending session...`);

      handleSessionEnded(sessionId, 'system', null, now, {
        reason: 'heartbeat-timeout',
        trigger: 'heartbeat-monitor',
        lastHeartbeat: session.lastHeartbeat,
        staleForMs: timeSinceLastHeartbeat,
      }).catch(error => {
        console.error(`Failed to end stale session ${sessionId}:`, error.message);
      });
    }
  }
}, 60000); // Check every minute

module.exports = router;
