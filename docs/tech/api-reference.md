# HTTP API Reference

Complete reference for all HTTP REST API endpoints in the LangDAO backend.

**Base URL (Development):** `http://localhost:4000`  
**Base URL (Production):** `https://your-backend.railway.app`

---

## Health Check

### `GET /health`

Check if the backend server is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-10T15:30:00.000Z",
  "environment": "development",
  "redis": "connected"
}
```

**Status Codes:**
- `200` - Server is healthy
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/health
```

---

## Tutor Endpoints

### `GET /api/tutors/available`

Get all currently available tutors.

**Response:**
```json
{
  "success": true,
  "tutors": [
    {
      "address": "0x1234...",
      "language": "spanish",
      "ratePerSecond": 100000,
      "socketId": "abc123"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/api/tutors/available
```

---

### `GET /api/tutors/:address`

Get tutor information from the smart contract.

**Parameters:**
- `address` (path) - Tutor's wallet address

**Response:**
```json
{
  "success": true,
  "tutor": {
    "totalEarnings": "1000000000",
    "sessionCount": 5,
    "isRegistered": true
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/api/tutors/0x1234567890abcdef1234567890abcdef12345678
```

---

### `GET /api/tutors/:address/availability`

Check if a specific tutor is currently available.

**Parameters:**
- `address` (path) - Tutor's wallet address

**Response:**
```json
{
  "success": true,
  "isAvailable": true,
  "tutor": {
    "address": "0x1234...",
    "language": "spanish",
    "ratePerSecond": 100000
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/api/tutors/0x1234567890abcdef1234567890abcdef12345678/availability
```

---

## Student Endpoints

### `GET /api/students/:address`

Get student information from the smart contract.

**Parameters:**
- `address` (path) - Student's wallet address

**Response:**
```json
{
  "success": true,
  "student": {
    "targetLanguage": 1,
    "budgetPerSec": 150000,
    "isRegistered": true
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/api/students/0x1234567890abcdef1234567890abcdef12345678
```

---

### `POST /api/students/:address/validate-budget`

Validate if a student can afford a specific tutor's rate.

**Parameters:**
- `address` (path) - Student's wallet address

**Request Body:**
```json
{
  "tutorAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "canAfford": true
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:4000/api/students/0xSTUDENT/validate-budget \
  -H "Content-Type: application/json" \
  -d '{"tutorAddress": "0xTUTOR"}'
```

---

## Matching Endpoints

### `POST /api/matching/find-tutors`

Find tutors that match student requirements.

**Request Body:**
```json
{
  "language": "spanish",
  "budgetPerSecond": 150000,
  "studentAddress": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "tutors": [
    {
      "address": "0x1234...",
      "language": "spanish",
      "ratePerSecond": 100000
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing required fields
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:4000/api/matching/find-tutors \
  -H "Content-Type: application/json" \
  -d '{
    "language": "spanish",
    "budgetPerSecond": 150000,
    "studentAddress": "0xSTUDENT"
  }'
```

---

### `GET /api/matching/stats`

Get matching system statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAvailableTutors": 5,
    "tutorsByLanguage": {
      "spanish": 3,
      "french": 2
    }
  }
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:4000/api/matching/stats
```

---

## WebRTC Events Endpoint

### `POST /api/webrtc-events`

Receives events from the WebRTC server (internal use).

**Request Body:**
```json
{
  "type": "session-ended",
  "sessionId": "req_abc123",
  "endedBy": "student",
  "userAddress": "0x...",
  "timestamp": 1699999000
}
```

**Event Types:**
- `user-connected` - User joined WebRTC room
- `session-heartbeat` - Heartbeat ping from active session
- `session-ended` - User clicked "End Call"
- `user-disconnected` - User lost connection

**Response:**
```json
{
  "success": true,
  "message": "Event processed"
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:4000/api/webrtc-events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "session-ended",
    "sessionId": "req_abc123",
    "endedBy": "student",
    "timestamp": 1699999000
  }'
```

**Notes:**
- This endpoint is called by the WebRTC server, not by clients
- Triggers `endSession()` on the smart contract
- Handles session cleanup and payment processing

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Messages:**
- `"Rate limit exceeded"` - Too many requests
- `"Missing required fields"` - Invalid request body
- `"Failed to get tutor information"` - Smart contract error
- `"Request not found or expired"` - Invalid session ID

---

## Rate Limiting

**HTTP Endpoints:** 100 requests per minute per IP  
**Socket Events:** 10 requests per minute per socket

**Rate Limit Response:**
```json
{
  "error": "Too many requests, please try again later"
}
```

**Headers:**
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time until reset

---

## Authentication

Currently, there is **no authentication** on HTTP endpoints. Authentication is handled via:
- Wallet signatures for blockchain transactions
- Socket.io connection binding for real-time events

**Future:** May add JWT or API key authentication for production.

---

## CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:3000`
- Production: Set via `CORS_ORIGIN` environment variable

**Allowed Methods:**
- `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`

**Allowed Headers:**
- `Content-Type`, `Authorization`

---

## Testing

### Using curl

```bash
# Health check
curl http://localhost:4000/health

# Get available tutors
curl http://localhost:4000/api/tutors/available

# Get matching stats
curl http://localhost:4000/api/matching/stats

# Find tutors
curl -X POST http://localhost:4000/api/matching/find-tutors \
  -H "Content-Type: application/json" \
  -d '{"language": "spanish", "budgetPerSecond": 150000}'
```

### Using JavaScript (fetch)

```javascript
// Get available tutors
const response = await fetch('http://localhost:4000/api/tutors/available');
const data = await response.json();
console.log(data.tutors);

// Find matching tutors
const response = await fetch('http://localhost:4000/api/matching/find-tutors', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    language: 'spanish',
    budgetPerSecond: 150000,
    studentAddress: '0x...'
  })
});
const data = await response.json();
console.log(data.tutors);
```

### Using Postman

1. Import collection from `docs/postman/langdao-api.json` (if available)
2. Set base URL to `http://localhost:4000`
3. Test endpoints

---

## Smart Contract Integration

These endpoints interact with the LangDAO smart contract:

| Endpoint | Contract Function |
|----------|-------------------|
| `GET /api/tutors/:address` | `getTutorInfo(address)` |
| `GET /api/students/:address` | `getStudentInfo(address)` |
| `POST /api/students/:address/validate-budget` | `canAffordRate(student, tutor)` |
| `POST /api/webrtc-events` (session-ended) | `endSession(tutorAddress)` |

**Contract Address:** Set via `CONTRACT_ADDRESS` environment variable

**RPC URL:** Set via `RPC_URL` environment variable

---

## Monitoring

### Health Check Monitoring

Set up monitoring to ping `/health` every 30 seconds:

```bash
# Simple monitoring script
while true; do
  curl -s http://localhost:4000/health | jq .
  sleep 30
done
```

### Logging

All requests are logged with:
- Timestamp
- Method and path
- Response status
- Response time

**Log Format (Morgan):**
```
:method :url :status :response-time ms - :res[content-length]
```

---

## Related Documentation

- [Socket Events Reference](socket-events.md) - Real-time Socket.io events
- [Architecture Overview](../architecture/overview.md) - System architecture
- [Environment Variables](../ops/environment-variables.md) - Configuration

---

**Last Updated:** November 10, 2025
