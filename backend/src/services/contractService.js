const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const redis = require('redis');

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.abi = null;
    this.initialized = false;
    this.initializing = null;
    this.enableFallback = (process.env.ALLOW_CONTRACT_FALLBACK || 'true').toLowerCase() !== 'false';
    this.redisClient = null;
    this.registrationCacheTTL = parseInt(process.env.REGISTRATION_CACHE_TTL || '300'); // 5 minutes default
    this.contractHealthy = true;

    console.log('ContractService: Constructor called, enableFallback:', this.enableFallback);
    
    // Initialize Redis client for caching
    this.initRedis();
  }

  async initRedis() {
    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.redisClient.on('error', (err) => console.error('ContractService Redis error:', err));
      
      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
        console.log('ContractService: Redis connected for caching');
      }
    } catch (error) {
      console.warn('ContractService: Failed to connect to Redis (caching disabled):', error.message);
      this.redisClient = null;
    }
  }

  isMockRegistration(data) {
    return !!(data && data.mockData === true);
  }

  async getCachedRegistration(address, type) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return null;
    }

    try {
      const key = `registration:${type}:${address.toLowerCase()}`;
      const raw = await this.redisClient.get(key);
      if (!raw) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn('[ContractService] Failed to parse cached registration', key, e);
        await this.redisClient.del(key);
        return null;
      }

      if (this.isMockRegistration(parsed)) {
        console.warn('[ContractService] Ignoring cached mock registration', key);
        await this.redisClient.del(key);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('ContractService: Failed to get cached registration:', error.message);
    }
    return null;
  }

  async setCachedRegistration(address, type, data) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return;
    }

    try {
      const key = `registration:${type}:${address.toLowerCase()}`;

      if (this.isMockRegistration(data)) {
        console.warn('[ContractService] Not caching mock registration', key);
        return;
      }

      await this.redisClient.setEx(key, this.registrationCacheTTL, JSON.stringify(data));
      console.log(`ContractService: Cached ${type} registration for ${address}`);
    } catch (error) {
      console.warn('ContractService: Failed to cache registration:', error.message);
    }
  }

  async invalidateRegistrationCache(address) {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return;
    }

    try {
      const studentKey = `registration:student:${address.toLowerCase()}`;
      const tutorKey = `registration:tutor:${address.toLowerCase()}`;
      await this.redisClient.del([studentKey, tutorKey]);
      console.log(`ContractService: Invalidated registration cache for ${address}`);
    } catch (error) {
      console.warn('ContractService: Failed to invalidate cache:', error.message);
    }
  }

  async invalidateAllRegistrationCache() {
    if (!this.redisClient || !this.redisClient.isOpen) {
      return;
    }

    try {
      console.warn('[ContractService] Invalidating all registration cache...');
      const iter = this.redisClient.scanIterator({
        MATCH: 'registration:*',
        COUNT: 100,
      });

      for await (const key of iter) {
        await this.redisClient.del(key);
      }

      console.warn('[ContractService] Registration cache invalidation complete');
    } catch (error) {
      console.warn('ContractService: Failed to invalidate all registration cache:', error.message);
    }
  }

  async init() {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async () => {
      try {
        const rpcUrl = process.env.RPC_URL || 'https://sepolia.infura.io/v3/be083655e4a64005b739c862bbb23b51';
        const contractAddress = process.env.CONTRACT_ADDRESS;

        console.log('ContractService: Initializing...');
        console.log('RPC_URL:', rpcUrl);
        console.log('CONTRACT_ADDRESS:', contractAddress);

        if (!rpcUrl) {
          console.warn('ContractService: RPC_URL not set.');
          return;
        }
        if (!contractAddress) {
          console.warn('ContractService: CONTRACT_ADDRESS not set.');
          return;
        }

        // Test provider connection
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        try {
          const network = await this.provider.getNetwork();
          console.log('ContractService: Connected to network:', network.chainId);
        } catch (err) {
          console.warn('ContractService: Failed to connect to network:', err.message);
          this.provider = null;
          return;
        }

        // Try to load ABI from deployment artifact
        let abiPath = process.env.CONTRACT_ABI_PATH;
        if (!abiPath) {
          // Default to Sepolia deployment artifact
          abiPath = path.resolve(
            __dirname,
            '../../../webapp/packages/hardhat/deployments/sepolia/LangDAO.json'
          );
        }

        console.log('ContractService: Looking for ABI at:', abiPath);

        if (fs.existsSync(abiPath)) {
          try {
            const artifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
            this.abi = artifact.abi;
            console.log('ContractService: ABI loaded successfully');
          } catch (err) {
            console.warn('ContractService: Failed to parse ABI file:', err.message);
          }
        } else {
          console.warn('ContractService: ABI file not found at:', abiPath);
          // Fallback to basic ABI for testing
          this.abi = [
            "function getTutor(address) view returns (string memory name, string[] memory languages, uint256 ratePerSecond, uint256 totalSessions, uint256 rating, bool isRegistered)",
            "function getStudent(address) view returns (string memory name, uint256 totalSessions, uint256 averageRating, bool isRegistered)",
            "function recordSession(address tutor, address student, uint256 duration, uint256 cost) external"
          ];
          console.log('ContractService: Using fallback ABI');
        }

        if (!this.abi) {
          console.warn('ContractService: No ABI available');
          return;
        }

        // Create contract instance
        this.contract = new ethers.Contract(contractAddress, this.abi, this.provider);

        // Optionally attach signer if PRIVATE_KEY is set
        const pk = process.env.PRIVATE_KEY;
        if (pk && pk !== 'your_private_key_here' && /^0x[0-9a-fA-F]{64}$/.test(pk)) {
          try {
            this.signer = new ethers.Wallet(pk, this.provider);
            this.contract = this.contract.connect(this.signer);
            console.log('ContractService: Signer attached for write operations');
          } catch (e) {
            console.warn('ContractService: Failed to attach signer:', e.message);
          }
        }

        console.log('ContractService: Initialized successfully');
        this.initialized = true;
      } catch (err) {
        console.warn('ContractService: Initialization failed:', err.message);
      } finally {
        this.initializing = null;
      }
    })();

    return this.initializing;
  }

  isContractAvailable() {
    return !!this.contract;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      provider: !!this.provider,
      contract: !!this.contract,
      signer: !!this.signer,
      mode: this.isContractAvailable() ? 'blockchain' : (this.enableFallback ? 'redis-only' : 'unavailable'),
    };
  }

  async getTutorInfo(address) {
    const normalized = address.toLowerCase();

    const cached = await this.getCachedRegistration(normalized, 'tutor');
    if (cached) {
      return cached;
    }

    await this.init();

    if (this.contract) {
      try {
        console.log('ContractService: Calling getTutor for address:', normalized);

        const tutorData = await this.contract.getTutor(normalized);

        console.log('ContractService: Got tutor data from contract:', tutorData);

        const tutorInfo = {
          address: normalized,
          name: tutorData[0] || tutorData.name || `Tutor_${normalized.slice(-4)}`,
          languages: tutorData[1] || tutorData.languages || ['english'],
          ratePerSecond: String(tutorData[2] || tutorData.ratePerSecond || '0.001'),
          totalSessions: Number(tutorData[3] || tutorData.totalSessions || 0),
          rating: Number(tutorData[4] || tutorData.rating || 0),
          isRegistered: Boolean(tutorData[5] !== undefined ? tutorData[5] : tutorData.isRegistered !== undefined ? tutorData.isRegistered : true),
        };

        if (!this.contractHealthy) {
          this.contractHealthy = true;
          await this.invalidateAllRegistrationCache();
        }

        await this.setCachedRegistration(normalized, 'tutor', tutorInfo);

        return tutorInfo;
      } catch (err) {
        console.error('[ContractService] getTutor error, falling back if allowed:', err);
        this.contractHealthy = false;
      }
    }

    if (this.enableFallback) {
      console.log('ContractService: Using mock data for tutor:', normalized);
      const mockData = {
        address: normalized,
        name: `MockTutor_${normalized.slice(-4)}`,
        languages: ['english', 'spanish'],
        ratePerSecond: '0.001',
        totalSessions: 5,
        rating: 4.5,
        isRegistered: true,
        mockData: true,
      };

      return mockData;
    }

    throw new Error('Tutor info unavailable and fallback is disabled');
  }

  async getStudentInfo(address) {
    const normalized = address.toLowerCase();

    const cached = await this.getCachedRegistration(normalized, 'student');
    if (cached) {
      return cached;
    }

    await this.init();

    if (this.contract) {
      try {
        console.log('ContractService: Calling getStudent for address:', normalized);

        const studentData = await this.contract.getStudent(normalized);

        const studentInfo = {
          address: normalized,
          name: studentData[0] || studentData.name || `Student_${normalized.slice(-4)}`,
          totalSessions: Number(studentData[1] || studentData.totalSessions || 0),
          averageRating: Number(studentData[2] || studentData.averageRating || 0),
          isRegistered: Boolean(studentData[3] !== undefined ? studentData[3] : studentData.isRegistered !== undefined ? studentData.isRegistered : true),
        };

        if (!this.contractHealthy) {
          this.contractHealthy = true;
          await this.invalidateAllRegistrationCache();
        }

        await this.setCachedRegistration(normalized, 'student', studentInfo);
        return studentInfo;
      } catch (err) {
        console.error('[ContractService] getStudent error, falling back if allowed:', err);
        this.contractHealthy = false;
      }
    }

    if (this.enableFallback) {
      console.log('ContractService: Using mock data for student:', normalized);
      const mockData = {
        address: normalized,
        name: `MockStudent_${normalized.slice(-4)}`,
        totalSessions: 3,
        averageRating: 4.2,
        isRegistered: true,
        mockData: true,
      };

      return mockData;
    }

    throw new Error('Student info unavailable and fallback is disabled');
  }

  async recordSession(tutorAddress, studentAddress, duration, cost) {
    await this.init();

    if (this.contract && this.signer) {
      try {
        console.log('ContractService: Recording session on blockchain');
        const tx = await this.contract.recordSession(tutorAddress, studentAddress, duration, cost);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt?.hash };
      } catch (e) {
        console.warn('ContractService.recordSession: Failed:', e.message);
        if (!this.enableFallback) {
          throw new Error('Failed to record session on blockchain');
        }
      }
    }

    if (this.enableFallback) {
      console.log('ContractService: Mock session recording');
      return {
        success: true,
        mockData: true,
        message: 'Session would be recorded on-chain when signer/contract is available',
      };
    }

    throw new Error('Contract not available and fallback disabled');
  }

  normalizeSessionStruct(session) {
    if (!session) return null;

    const toNumber = value => {
      if (value === undefined || value === null) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'bigint') return Number(value);
      if (typeof value === 'object' && typeof value.toString === 'function') {
        return Number(value.toString());
      }
      return Number(value);
    };

    const toStringValue = value => {
      if (value === undefined || value === null) return '0';
      if (typeof value === 'string') return value;
      if (typeof value === 'bigint') return value.toString();
      if (typeof value === 'object' && typeof value.toString === 'function') {
        return value.toString();
      }
      return String(value);
    };

    return {
      student: session.student,
      tutor: session.tutor,
      token: session.token,
      startTime: toNumber(session.startTime),
      endTime: toNumber(session.endTime),
      ratePerSecondWei: toStringValue(session.ratePerSecond),
      totalPaidWei: toStringValue(session.totalPaid),
      language: toNumber(session.language),
      id: toNumber(session.id),
      isActive: Boolean(session.isActive),
    };
  }

  async getActiveSession(tutorAddress) {
    await this.init();

    if (!this.contract) {
      if (this.enableFallback) {
        return null;
      }
      throw new Error('Contract not initialized');
    }

    try {
      const session = await this.contract.activeSessions(tutorAddress);
      return this.normalizeSessionStruct(session);
    } catch (error) {
      console.warn('ContractService.getActiveSession: Failed to read active session:', error.message);
      if (!this.enableFallback) {
        throw error;
      }
      return null;
    }
  }

  async getSessionFromHistory(sessionId) {
    await this.init();

    if (!this.contract) {
      if (this.enableFallback) {
        return null;
      }
      throw new Error('Contract not initialized');
    }

    try {
      const session = await this.contract.sessionHistory(sessionId);
      if (!session) return null;
      const normalized = this.normalizeSessionStruct(session);
      if (normalized) {
        normalized.durationSeconds = Math.max(0, (normalized.endTime || 0) - (normalized.startTime || 0));
      }
      return normalized;
    } catch (error) {
      console.warn('ContractService.getSessionFromHistory: Failed:', error.message);
      if (!this.enableFallback) {
        throw error;
      }
      return null;
    }
  }

  async endSession(tutorAddress) {
    await this.init();

    if (this.contract && this.signer) {
      try {
        console.log('ContractService: Ending session on blockchain');
        const tx = await this.contract.endSession(tutorAddress);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt?.hash, receipt };
      } catch (error) {
        console.warn('ContractService.endSession: Failed:', error.message);
        if (!this.enableFallback) {
          throw error;
        }
      }
    }

    if (this.enableFallback) {
      console.log('ContractService: Mock session end');
      return {
        success: true,
        mockData: true,
        message: 'Session would be ended on-chain when signer/contract is available',
      };
    }

    throw new Error('Contract not available and fallback disabled');
  }
}

module.exports = new ContractService();
