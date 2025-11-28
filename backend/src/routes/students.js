const express = require("express");
const router = express.Router();
const contractService = require("../services/contractService");

/**
 * GET /api/students/:address
 * Get student information from smart contract
 */
router.get("/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const studentInfo = await contractService.getStudentInfo(address);

    res.json({
      success: true,
      student: studentInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get student information",
    });
  }
});

/**
 * POST /api/students/:address/validate-budget
 * Validate if student can afford a specific tutor's rate
 */
router.post("/:address/validate-budget", async (req, res) => {
  try {
    const { address } = req.params;
    const { tutorAddress } = req.body;

    const canAfford = await contractService.canAffordRate(
      address,
      tutorAddress
    );

    res.json({
      success: true,
      canAfford: canAfford,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to validate budget",
    });
  }
});

/**
 * POST /api/students/:address/invalidate-cache
 * Invalidate registration cache for a student (call after registration)
 */
router.post("/:address/invalidate-cache", async (req, res) => {
  try {
    const { address } = req.params;
    await contractService.invalidateRegistrationCache(address);
    res.json({
      success: true,
      message: "Cache invalidated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to invalidate cache",
    });
  }
});

module.exports = router;
