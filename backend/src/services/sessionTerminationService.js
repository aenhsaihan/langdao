const { ethers } = require('ethers');
const sessionService = require('./sessionService');
const contractService = require('./contractService');

const PYUSD_DECIMALS = parseInt(process.env.PYUSD_DECIMALS || '6', 10);

function formatPyusdAmount(valueWei) {
  try {
    const bnValue = typeof valueWei === 'bigint' ? valueWei : BigInt(valueWei || 0);
    return ethers.formatUnits(bnValue, PYUSD_DECIMALS);
  } catch (error) {
    console.warn('sessionTerminationService: failed to format amount', error.message);
    return '0';
  }
}

function calculateFallbackCost(durationSeconds, ratePerSecondWei) {
  try {
    const durationBn = BigInt(Math.max(0, durationSeconds || 0));
    const rateBn = BigInt(ratePerSecondWei || 0);
    return (durationBn * rateBn).toString();
  } catch (error) {
    console.warn('sessionTerminationService: failed to calculate fallback cost', error.message);
    return '0';
  }
}

async function finalizeSession({ sessionId, initiatedBy, context = {} }) {
  const sessionMapping = await sessionService.getSessionMapping(sessionId);

  if (!sessionMapping.success) {
    return {
      success: false,
      statusCode: 404,
      error: `Session ${sessionId} is not active`,
    };
  }

  const session = sessionMapping.session;
  let activeSessionOnChain = null;
  let blockchainSessionId = null;

  try {
    activeSessionOnChain = await contractService.getActiveSession(session.tutorAddress);
    if (activeSessionOnChain && activeSessionOnChain.isActive) {
      blockchainSessionId = activeSessionOnChain.id ?? null;
    }
  } catch (error) {
    console.warn('sessionTerminationService: failed to read active session', error.message);
  }

  let txResult;
  try {
    txResult = await contractService.endSession(session.tutorAddress);
  } catch (error) {
    console.error('sessionTerminationService: failed to end session on chain', error);
    return {
      success: false,
      statusCode: 502,
      error: 'Failed to end blockchain session',
      details: error.message,
    };
  }

  let historyData = null;
  if (blockchainSessionId !== null && blockchainSessionId !== undefined) {
    try {
      historyData = await contractService.getSessionFromHistory(blockchainSessionId);
    } catch (error) {
      console.warn('sessionTerminationService: failed to fetch session history', error.message);
    }
  }

  const now = Date.now();
  const startedAtMs = session.startTime || now;
  const durationSecondsFromChain = historyData?.durationSeconds;
  const durationSecondsFromContext = context.durationSeconds;
  const durationSeconds = Math.max(
    1,
    durationSecondsFromChain ||
      durationSecondsFromContext ||
      Math.floor((now - startedAtMs) / 1000),
  );

  const chainPaidWei = historyData?.totalPaidWei;
  const reportedRatePerSecond = context.ratePerSecondWei || context.estimatedRatePerSecondWei;
  const onChainRate = activeSessionOnChain?.ratePerSecondWei;
  const fallbackCostWei = calculateFallbackCost(durationSeconds, reportedRatePerSecond || onChainRate || '0');
  const totalPaidWei = chainPaidWei || fallbackCostWei;

  await sessionService.removeSessionMapping(sessionId);

  const summary = {
    sessionId,
    blockchainSessionId: historyData?.id || blockchainSessionId,
    tutorAddress: session.tutorAddress,
    studentAddress: session.studentAddress,
    languageId: session.languageId,
    durationSeconds,
    costWei: totalPaidWei,
    costFormatted: formatPyusdAmount(totalPaidWei),
    costCurrency: 'PYUSD',
    endedAt: new Date(now).toISOString(),
    initiatedBy: initiatedBy || null,
    metadata: {
      ...context,
      onChain: !txResult?.mockData,
    },
  };

  return {
    success: true,
    summary,
    transaction: {
      hash: txResult?.txHash || txResult?.hash || null,
      receipt: txResult?.receipt || null,
      mock: Boolean(txResult?.mockData),
    },
  };
}

module.exports = {
  finalizeSession,
};
