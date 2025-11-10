# Integrations

## Currently Integrated

### Custom WebRTC Implementation
- Peer-to-peer video calls
- Real-time audio/video communication
- Session monitoring and disconnect detection
- Custom server implementation (not Huddle01)
- **Status:** ✅ Implemented

### PYUSD (Payment Token)
- PayPal USD stablecoin on Sepolia testnet
- Used for all session payments
- Contract address: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`
- **Status:** ✅ Implemented

### Custom Payment System
- Timestamp-based payment calculation
- Payment = `(endTime - startTime) * ratePerSecond`
- No external streaming protocol needed
- **Status:** ✅ Implemented (replaced Superfluid/Sablier)

## Planned / Future

### POAP / Credentials
- Mint proof of session completion
- Display in wallet/portfolio
- **Status:** 🔄 Planned

### Chainlink
- Data feeds for exchange rates
- Automation for scheduled sessions
- **Status:** 🔄 Planned

### Storage (IPFS/Arweave)
- Session metadata
- User profiles
- Rating/review data
- **Status:** 🔄 Planned

### Attestation Layers
- EAS (Ethereum Attestation Service)
- Tutor credentials
- Skill verification
- **Status:** 🔄 Planned

## Removed / Not Using

### ~~Superfluid~~
- Originally planned for streaming payments
- Removed due to complexity with session end handling
- Replaced with custom timestamp-based system

### ~~Sablier~~
- Originally considered as Superfluid alternative
- Not needed with custom payment system
