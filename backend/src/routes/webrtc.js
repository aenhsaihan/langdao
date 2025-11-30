const express = require('express');
const sessionService = require('../services/sessionService');
const { finalizeSession } = require('../services/sessionTerminationService');
const contractService = require('../services/contractService');

// Store active sessions and their heartbeat status
const activeSessions = new Map();

// Export a function that takes io and redisClient
module.exports = function(io, redisClient) {
  const router = express.Router();

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
 * POST /api/webrtc-session-ended
 * Called by frontend when user ends session via blockchain transaction
 * This ensures both parties get notified via socket events
 * 
 * NEW DESIGN: Destroyable room - verifies blockchain state before destroying room
 */
router.post('/webrtc-session-ended', async (req, res) => {
  try {
    const { sessionId, userAddress, transactionHash } = req.body;

    console.log(`📡 Session ended notification received:`, { sessionId, userAddress, transactionHash });

    if (!sessionId || !userAddress) {
      return res.status(400).json({ success: false, error: 'Missing sessionId or userAddress' });
    }

    // Step 1: Get session mapping to find tutor address
    const sessionMapping = await sessionService.getSessionMapping(sessionId);
    if (!sessionMapping.success) {
      console.error(`Failed to get session mapping for ${sessionId}`);
      return res.status(404).json({ success: false, error: 'Session mapping not found' });
    }

    const session = sessionMapping.session;
    const tutorAddress = session.tutorAddress;
    const studentAddress = session.studentAddress;

    // Step 2: Verify blockchain state - check if session is actually ended
    console.log(`🔍 Verifying blockchain state for session ${sessionId} (tutor: ${tutorAddress})...`);
    let blockchainVerified = false;
    let verificationAttempts = 0;
    const maxVerificationAttempts = 5;
    const verificationDelay = 1000; // 1 second between attempts

    while (!blockchainVerified && verificationAttempts < maxVerificationAttempts) {
      try {
        const activeSessionOnChain = await contractService.getActiveSession(tutorAddress);
        
        if (!activeSessionOnChain || !activeSessionOnChain.isActive) {
          // Session is confirmed ended on blockchain
          blockchainVerified = true;
          console.log(`✅ Blockchain verification successful: Session ${sessionId} is confirmed ended`);
          break;
        } else {
          // Session still active, wait and retry
          verificationAttempts++;
          if (verificationAttempts < maxVerificationAttempts) {
            console.log(`⏳ Session still active on blockchain, retrying... (attempt ${verificationAttempts}/${maxVerificationAttempts})`);
            await new Promise(resolve => setTimeout(resolve, verificationDelay));
          } else {
            console.warn(`⚠️ Max verification attempts reached. Session may still be active, but proceeding with room destruction.`);
            // Proceed anyway - transaction may be pending
            blockchainVerified = true;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Error verifying blockchain state (attempt ${verificationAttempts + 1}):`, error.message);
        verificationAttempts++;
        if (verificationAttempts >= maxVerificationAttempts) {
          console.warn(`⚠️ Max verification attempts reached due to errors. Proceeding with room destruction.`);
          // Proceed anyway - may be a temporary blockchain issue
          blockchainVerified = true;
        } else {
          await new Promise(resolve => setTimeout(resolve, verificationDelay));
        }
      }
    }

    // Step 3: Destroy the room (remove from activeSessions)
    if (activeSessions.has(sessionId)) {
      activeSessions.delete(sessionId);
      console.log(`🗑️ Room ${sessionId} destroyed from activeSessions`);
    } else {
      console.log(`ℹ️ Room ${sessionId} was not in activeSessions (may have been already destroyed)`);
    }

    // Step 4: Call finalizeSession to get session summary (this also calls endSession on chain if not already done)
    const result = await finalizeSession({
      sessionId,
      initiatedBy: 'user',
      context: {
        userAddress,
        endedBy: 'user',
        timestamp: Date.now(),
        transactionHash,
        trigger: 'frontend-end-session',
        blockchainVerified,
      },
    });

    if (!result?.success) {
      console.error(`Failed to finalize session ${sessionId}:`, result?.error || 'Unknown error');
      // Still send socket events even if finalization failed
    }

    // Step 5: Emit socket events to both parties so they can redirect
    try {
      const tutorSocketId = await getSocketIdFromAddress(tutorAddress);
      const studentSocketId = await getSocketIdFromAddress(studentAddress);

      // Prepare receipt data for both parties
      const receiptData = {
        sessionId: result?.summary?.blockchainSessionId || sessionId,
        duration: result?.summary?.durationSeconds || 0,
        cost: parseFloat(result?.summary?.costFormatted || '0'),
        transactionHash: result?.transaction?.hash || transactionHash || null,
        tutorAddress,
        studentAddress,
        endedBy: userAddress,
        roomDestroyed: true, // Signal that room has been destroyed
      };

      // Emit to tutor (shows earnings)
      if (tutorSocketId) {
        console.log(`📤 Emitting session:ended to tutor ${tutorAddress} (socket: ${tutorSocketId})`);
        io.to(tutorSocketId).emit("session:ended", {
          ...receiptData,
          role: "tutor",
          earnings: receiptData.cost, // Tutor sees earnings
        });
      } else {
        console.warn(`⚠️ Could not find tutor socket for ${tutorAddress}`);
        console.log(`🔍 Attempting to find tutor socket by searching all connected sockets...`);
        
        // Try to find tutor socket by searching all connected sockets
        const allSockets = Array.from(io.sockets.sockets.values());
        let foundTutorSocket = null;
        for (const s of allSockets) {
          try {
            const socketAddress = await redisClient.hGet("socket_to_address", s.id);
            if (socketAddress && socketAddress.toLowerCase() === tutorAddress.toLowerCase()) {
              foundTutorSocket = s.id;
              console.log(`✅ Found tutor socket by searching: ${foundTutorSocket}`);
              // Update Redis with the found socket ID
              await redisClient.hSet(`tutor:${tutorAddress.toLowerCase()}`, { socketId: foundTutorSocket });
              break;
            }
          } catch (err) {
            // Continue searching
          }
        }
        
        if (foundTutorSocket) {
          console.log(`📤 Emitting session:ended to tutor ${tutorAddress} (socket: ${foundTutorSocket})`);
          io.to(foundTutorSocket).emit("session:ended", {
            ...receiptData,
            role: "tutor",
            earnings: receiptData.cost,
          });
        } else {
          console.warn(`⚠️ Tutor socket not found even after searching all sockets. Will rely on broadcast.`);
        }
      }

      // Emit to student (shows cost)
      if (studentSocketId) {
        console.log(`📤 Emitting session:ended to student ${studentAddress} (socket: ${studentSocketId})`);
        io.to(studentSocketId).emit("session:ended", {
          ...receiptData,
          role: "student",
          cost: receiptData.cost, // Student sees cost
        });
      } else {
        console.warn(`⚠️ Could not find student socket for ${studentAddress}`);
        console.log(`🔍 Attempting to find student socket by searching all connected sockets...`);
        
        // Try to find student socket by searching all connected sockets
        const allSockets = Array.from(io.sockets.sockets.values());
        let foundStudentSocket = null;
        for (const s of allSockets) {
          try {
            const socketAddress = await redisClient.hGet("socket_to_address", s.id);
            if (socketAddress && socketAddress.toLowerCase() === studentAddress.toLowerCase()) {
              foundStudentSocket = s.id;
              console.log(`✅ Found student socket by searching: ${foundStudentSocket}`);
              break;
            }
          } catch (err) {
            // Continue searching
          }
        }
        
        if (foundStudentSocket) {
          console.log(`📤 Emitting session:ended to student ${studentAddress} (socket: ${foundStudentSocket})`);
          io.to(foundStudentSocket).emit("session:ended", {
            ...receiptData,
            role: "student",
            cost: receiptData.cost,
          });
        } else {
          console.warn(`⚠️ Student socket not found even after searching all sockets. Will rely on broadcast.`);
        }
      }

      // ALWAYS broadcast as backup - this ensures both parties receive the event even if socket lookup fails
      // Frontend will filter by tutorAddress/studentAddress to determine if event is for them
      console.log(`📢 Broadcasting session:ended to ALL sockets (backup mechanism)`);
      console.log(`📢 Broadcast data:`, {
        tutorAddress,
        studentAddress,
        sessionId: receiptData.sessionId,
        roomDestroyed: receiptData.roomDestroyed,
      });
      io.emit("session:ended", receiptData);
    } catch (error) {
      console.error(`Error emitting session:ended events:`, error);
      // Even if there's an error, try to broadcast as last resort
      try {
        console.log(`🆘 Attempting emergency broadcast due to error...`);
        io.emit("session:ended", {
          sessionId: result?.summary?.blockchainSessionId || sessionId,
          tutorAddress,
          studentAddress,
          roomDestroyed: true,
        });
      } catch (broadcastError) {
        console.error(`❌ Failed to broadcast session:ended event:`, broadcastError);
      }
    }

    res.json({
      success: true,
      message: 'Session ended, room destroyed, and parties notified',
      blockchainVerified,
      ...(result?.summary ? { summary: result.summary } : {}),
    });
  } catch (error) {
    console.error('Error processing session ended notification:', error);
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
 * Helper to get socket ID from address
 */
async function getSocketIdFromAddress(address) {
  if (!address || !redisClient) return null;
  
  try {
    // First try to get from tutor hash
    const tutorHash = await redisClient.hGetAll(`tutor:${address.toLowerCase()}`);
    if (tutorHash?.socketId && io.sockets.sockets.get(tutorHash.socketId)) {
      return tutorHash.socketId;
    }
    
    // Search all sockets
    const allSockets = Array.from(io.sockets.sockets.values());
    for (const s of allSockets) {
      const socketAddress = await redisClient.hGet("socket_to_address", s.id);
      if (socketAddress && socketAddress.toLowerCase() === address.toLowerCase()) {
        return s.id;
      }
    }
  } catch (error) {
    console.error(`Error getting socket ID for ${address}:`, error);
  }
  
  return null;
}

/**
 * Handle session ended by user clicking "End Call"
 * This should call endSession on the smart contract and notify both parties
 * 
 * NEW DESIGN: Destroyable room - verifies blockchain state and destroys room
 */
async function handleSessionEnded(sessionId, endedBy, userAddress, timestamp, extraContext = {}) {
  console.log(`🛑 Session ended by ${endedBy}: ${sessionId}`);

  // Get session mapping to find tutor and student addresses
  const sessionMapping = await sessionService.getSessionMapping(sessionId);
  if (!sessionMapping.success) {
    console.error(`Failed to get session mapping for ${sessionId}`);
    return { success: false, error: 'Session mapping not found' };
  }

  const session = sessionMapping.session;
  const tutorAddress = session.tutorAddress;
  const studentAddress = session.studentAddress;

  // Verify blockchain state if not already verified
  let blockchainVerified = extraContext.blockchainVerified || false;
  if (!blockchainVerified && extraContext.trigger !== 'frontend-end-session') {
    // For non-frontend triggers, verify blockchain state
    console.log(`🔍 Verifying blockchain state for session ${sessionId}...`);
    try {
      const activeSessionOnChain = await contractService.getActiveSession(tutorAddress);
      if (!activeSessionOnChain || !activeSessionOnChain.isActive) {
        blockchainVerified = true;
        console.log(`✅ Blockchain verification successful: Session ${sessionId} is confirmed ended`);
      } else {
        console.log(`⏳ Session still active on blockchain, but proceeding with finalization`);
      }
    } catch (error) {
      console.warn(`⚠️ Error verifying blockchain state:`, error.message);
    }
  }

  const result = await finalizeSession({
    sessionId,
    initiatedBy: endedBy || userAddress,
    context: {
      userAddress,
      endedBy,
      timestamp,
      blockchainVerified,
      ...extraContext,
    },
  });

  if (!result?.success) {
    console.error(`Failed to finalize session ${sessionId}:`, result?.error || 'Unknown error');
    // Still destroy room and send events even if finalization failed
  }

  // Destroy the room (remove from activeSessions)
  if (activeSessions.has(sessionId)) {
    activeSessions.delete(sessionId);
    console.log(`🗑️ Room ${sessionId} destroyed from activeSessions`);
  }

  console.log(
    `✅ Session ${sessionId} finalized (duration: ${result.summary?.durationSeconds}s, cost: ${result.summary?.costFormatted} ${result.summary?.costCurrency})`
  );

  // Emit socket events to both tutor and student
  try {
    const tutorSocketId = await getSocketIdFromAddress(tutorAddress);
    const studentSocketId = await getSocketIdFromAddress(studentAddress);

    // Prepare receipt data for both parties
    const receiptData = {
      sessionId: result.summary?.blockchainSessionId || sessionId,
      duration: result.summary?.durationSeconds || 0,
      cost: parseFloat(result.summary?.costFormatted || '0'),
      transactionHash: result.transaction?.hash || null,
      tutorAddress,
      studentAddress,
      endedBy: endedBy || userAddress,
      roomDestroyed: true, // Signal that room has been destroyed
    };

    // Emit to tutor (shows earnings)
    if (tutorSocketId) {
      console.log(`📤 Emitting session:ended to tutor ${tutorAddress} (socket: ${tutorSocketId})`);
      io.to(tutorSocketId).emit("session:ended", {
        ...receiptData,
        role: "tutor",
        earnings: receiptData.cost, // Tutor sees earnings
      });
    } else {
      console.warn(`⚠️ Could not find tutor socket for ${tutorAddress}`);
    }

    // Emit to student (shows cost)
    if (studentSocketId) {
      console.log(`📤 Emitting session:ended to student ${studentAddress} (socket: ${studentSocketId})`);
      io.to(studentSocketId).emit("session:ended", {
        ...receiptData,
        role: "student",
        cost: receiptData.cost, // Student sees cost
      });
    } else {
      console.warn(`⚠️ Could not find student socket for ${studentAddress}`);
    }

    // Also broadcast as backup (both will filter by role/address)
    console.log(`📢 Broadcasting session:ended to all sockets (as backup)`);
    io.emit("session:ended", receiptData);
  } catch (error) {
    console.error(`Error emitting session:ended events:`, error);
  }

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

  return router;
};
