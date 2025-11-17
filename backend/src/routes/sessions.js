const express = require('express');
const router = express.Router();
const { finalizeSession } = require('../services/sessionTerminationService');

router.post('/sessions/:sessionId/end', async (req, res) => {
  const { sessionId } = req.params;
  const {
    userAddress,
    userRole,
    endedBy,
    reason,
    durationSeconds,
    ratePerSecondWei,
    estimatedRatePerSecondWei,
  } = req.body || {};

  const normalizedDuration =
    typeof durationSeconds === 'number'
      ? durationSeconds
      : durationSeconds
      ? parseInt(durationSeconds, 10)
      : undefined;

  try {
    const result = await finalizeSession({
      sessionId,
      initiatedBy: endedBy || userAddress || 'unknown',
      context: {
        source: 'rest-api',
        userAddress,
        userRole,
        reason,
        durationSeconds: Number.isFinite(normalizedDuration) ? normalizedDuration : undefined,
        ratePerSecondWei,
        estimatedRatePerSecondWei,
      },
    });

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
        details: result.details,
      });
    }

    return res.json({
      success: true,
      summary: result.summary,
      transaction: result.transaction,
    });
  } catch (error) {
    console.error('Failed to end session via API:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end session',
      details: error.message,
    });
  }
});

module.exports = router;
