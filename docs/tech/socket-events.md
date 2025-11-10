# Socket.io Events Reference

Complete reference for all Socket.io events used in the LangDAO real-time matching system.

**Backend:** `backend/src/server.js`  
**Rate Limit:** 10 requests per minute per socket

---

## Connection Events

### `user:connect`

**Direction:** Client → Server  
**Purpose:** Bind socket ID to wallet address for routing messages

**Payload:**
```javascript
{
  role: "student" | "tutor",
  address: "0x..." // Wallet address
}
```

**Response:** None (silent success)

**Example:**
```javascript
socket.emit("user:connect", {
  role: "student",
  address: "0x1234567890abcdef1234567890abcdef12345678"
});
```

---

## Tutor Events

### `tutor:setAvailable`

**Direction:** Client → Server  
**Purpose:** Tutor goes online and becomes available for matching

**Payload:**
```javascript
{
  address: "0x...",
  language: "spanish", // lowercase language code
  ratePerSecond: 100000 // in PYUSD wei (6 decimals)
}
```

**Callback Response:**
```javascript
{
  ok: true,
  result: { success: true },
  pendingRequests: 2 // Number of pending student requests
}
```

**Server Emits:**
- `tutor:incoming-request` - If there are pending student requests
- `tutor:available-updated` (broadcast) - Notify all clients

**Example:**
```javascript
socket.emit("tutor:setAvailable", {
  address: "0x...",
  language: "spanish",
  ratePerSecond: 100000
}, (response) => {
  if (response.ok) {
    console.log(`Available! ${response.pendingRequests} pending requests`);
  }
});
```

**Notes:**
- Automatically checks for pending student requests
- Notifies tutor of any matching requests immediately
- Old event name `tutor:set-available` still works (deprecated)

---

### `tutor:set-unavailable`

**Direction:** Client → Server  
**Purpose:** Tutor goes offline and stops receiving requests

**Payload:**
```javascript
{
  address: "0x..."
}
```

**Server Emits:**
- `tutor:availability-removed` - Confirmation to tutor
- `tutor:withdrew-acceptance` (broadcast) - If tutor was in a session state
- `tutor:available-updated` (broadcast) - Notify all clients

**Example:**
```javascript
socket.emit("tutor:set-unavailable", {
  address: "0x..."
});
```

---

### `tutor:accept-request`

**Direction:** Client → Server  
**Purpose:** Tutor accepts a student's request

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x..."
}
```

**Server Emits:**
- `student:tutor-accepted` - To the student who made the request
- `tutor:request-accepted` - Confirmation to tutor

**Example:**
```javascript
socket.emit("tutor:accept-request", {
  requestId: "req_abc123",
  tutorAddress: "0x..."
});
```

**Notes:**
- Request is removed from pending after acceptance
- Student receives tutor details (address, language, rate)

---

### `tutor:decline-request`

**Direction:** Client → Server  
**Purpose:** Tutor declines a student's request

**Payload:**
```javascript
{
  requestId: "req_abc123"
}
```

**Server Emits:**
- `tutor:request-declined` - Confirmation to tutor

**Example:**
```javascript
socket.emit("tutor:decline-request", {
  requestId: "req_abc123"
});
```

---

### `tutor:withdraw-acceptance`

**Direction:** Client → Server  
**Purpose:** Tutor withdraws their acceptance and returns to waiting

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
}
```

**Server Emits:**
- `tutor:withdrew-acceptance` (broadcast) - Notify student

**Example:**
```javascript
socket.emit("tutor:withdraw-acceptance", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
});
```

---

## Student Events

### `student:request-tutor`

**Direction:** Client → Server  
**Purpose:** Student requests a tutor for a language

**Payload:**
```javascript
{
  requestId: "req_abc123", // Unique request ID
  studentAddress: "0x...",
  language: "spanish",
  budgetPerSecond: 150000 // Maximum rate willing to pay
}
```

**Server Emits:**
- `student:request-sent` - Confirmation to student
- `tutor:incoming-request` - To all matching tutors
- `student:no-tutors-available` - If no tutors online (request still stored)

**Example:**
```javascript
socket.emit("student:request-tutor", {
  requestId: "req_" + Date.now(),
  studentAddress: "0x...",
  language: "spanish",
  budgetPerSecond: 150000
});
```

**Notes:**
- Request is stored in Redis even if no tutors available
- Tutors who come online later will see this request
- Multiple tutors can accept the same request

---

### `student:cancel-request`

**Direction:** Client → Server  
**Purpose:** Student cancels their pending request

**Payload:**
```javascript
{
  requestId: "req_abc123",
  studentAddress: "0x..."
}
```

**Server Emits:**
- `student:request-cancelled` - Confirmation to student
- `student:request-cancelled-broadcast` (broadcast) - Notify all tutors

**Example:**
```javascript
socket.emit("student:cancel-request", {
  requestId: "req_abc123",
  studentAddress: "0x..."
});
```

---

### `student:accept-tutor`

**Direction:** Client → Server  
**Purpose:** Student accepts a specific tutor (rejects all others)

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
}
```

**Server Emits:**
- `tutor:student-selected` - To the accepted tutor
- `tutor:student-rejected` - To all other tutors who accepted
- `student:tutor-accepted` - Confirmation to student

**Example:**
```javascript
socket.emit("student:accept-tutor", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
});
```

**Notes:**
- Request is removed from storage
- All other tutors are notified they were rejected

---

### `student:reject-tutor`

**Direction:** Client → Server  
**Purpose:** Student rejects a specific tutor (continues waiting for others)

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
}
```

**Server Emits:**
- `tutor:student-rejected` - To the rejected tutor
- `student:tutor-rejected` - Confirmation to student

**Example:**
```javascript
socket.emit("student:reject-tutor", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
});
```

**Notes:**
- Request remains active for other tutors
- Student can continue receiving offers

---

### `student:rejected-transaction`

**Direction:** Client → Server  
**Purpose:** Student rejected the wallet transaction to start session

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
}
```

**Server Emits:**
- `tutor:student-rejected-transaction` - To tutor
- `student:transaction-rejection-confirmed` - Confirmation to student

**Example:**
```javascript
socket.emit("student:rejected-transaction", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x..."
});
```

**Notes:**
- Tutor returns to waiting state
- Student can try again or cancel

---

### `student:entered-room`

**Direction:** Client → Server  
**Purpose:** Student has entered the WebRTC room

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x...",
  videoCallUrl: "https://...",
  languageId: 1 // Optional
}
```

**Server Emits:**
- `student:in-room` - To tutor (tutor can now join)
- `student:room-entry-confirmed` - Confirmation to student

**Example:**
```javascript
socket.emit("student:entered-room", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x...",
  videoCallUrl: "https://webrtc.example.com/room/abc123"
});
```

**Notes:**
- Session mapping is stored in Redis for later cleanup
- Tutor is notified to join the room

---

## Session Events

### `session:started`

**Direction:** Client → Server  
**Purpose:** Blockchain transaction confirmed, session officially started

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x...",
  videoCallUrl: "https://...",
  languageId: 1 // Optional
}
```

**Server Emits:**
- `session:started` - To tutor (with video call URL)
- `session:started-confirmed` - Confirmation to student

**Example:**
```javascript
socket.emit("session:started", {
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x...",
  videoCallUrl: "https://webrtc.example.com/room/abc123",
  languageId: 1
});
```

**Notes:**
- Session mapping stored in Redis
- Tutor receives video call URL to join

---

## Server-Emitted Events

These events are emitted by the server to clients:

### `tutor:incoming-request`

**Direction:** Server → Tutor  
**Purpose:** Notify tutor of a student request

**Payload:**
```javascript
{
  requestId: "req_abc123",
  student: {
    address: "0x...",
    language: "spanish",
    budgetPerSecond: 150000
  }
}
```

---

### `student:tutor-accepted`

**Direction:** Server → Student  
**Purpose:** Notify student that a tutor accepted their request

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  language: "spanish",
  ratePerSecond: 100000,
  socketId: "socket_id_here"
}
```

---

### `tutor:student-selected`

**Direction:** Server → Tutor  
**Purpose:** Notify tutor they were selected by student

**Payload:**
```javascript
{
  requestId: "req_abc123",
  studentAddress: "0x...",
  message: "Student selected you! Session starting..."
}
```

---

### `tutor:student-rejected`

**Direction:** Server → Tutor  
**Purpose:** Notify tutor they were rejected

**Payload:**
```javascript
{
  requestId: "req_abc123",
  studentAddress: "0x...",
  selectedTutorAddress: "0x..." | null,
  message: "Student selected another tutor"
}
```

---

### `tutor:withdrew-acceptance`

**Direction:** Server → Student (broadcast)  
**Purpose:** Notify that tutor withdrew their acceptance

**Payload:**
```javascript
{
  requestId: "req_abc123",
  tutorAddress: "0x...",
  studentAddress: "0x...",
  message: "Tutor withdrew their acceptance..."
}
```

---

### `student:in-room`

**Direction:** Server → Tutor  
**Purpose:** Notify tutor that student is in the WebRTC room

**Payload:**
```javascript
{
  requestId: "req_abc123",
  studentAddress: "0x...",
  videoCallUrl: "https://...",
  message: "Student is in the room! You can join now."
}
```

---

### `error`

**Direction:** Server → Client  
**Purpose:** Notify client of an error

**Payload:**
```javascript
{
  message: "Error description"
}
```

**Common Errors:**
- "Rate limit exceeded"
- "Missing required fields"
- "Request not found or expired"
- "Failed to process request"

---

## Connection Management

### `disconnect`

**Direction:** Automatic (Socket.io)  
**Purpose:** Handle client disconnection

**Server Actions:**
- Remove tutor from available list
- Clean up socket-to-address mapping
- Broadcast availability update
- Clean up rate limiting data

**Disconnect Reasons:**
- `transport close` - Connection closed
- `client namespace disconnect` - Client disconnected
- `ping timeout` - No ping received
- `transport error` - Network error

---

## Rate Limiting

All socket events are rate-limited to **10 requests per minute per socket**.

**Exceeded Response:**
```javascript
{
  ok: false,
  error: "Rate limit exceeded"
}
```

Or emitted as:
```javascript
socket.emit("error", { message: "Rate limit exceeded" });
```

---

## Redis Data Structures

### Tutor Availability
```
Key: tutor:{address}
Type: Hash
Fields:
  - socketId: "socket_id"
  - language: "spanish"
  - ratePerSecond: "100000"
```

### Student Requests
```
Key: student_request:{requestId}
Type: Hash
Fields:
  - studentAddress: "0x..."
  - studentSocketId: "socket_id"
  - language: "spanish"
  - budgetPerSecond: "150000"
  - timestamp: "1699999000"
```

### Session Mapping
```
Key: session:{requestId}
Type: Hash
Fields:
  - studentAddress: "0x..."
  - tutorAddress: "0x..."
  - languageId: "1"
```

### Socket-to-Address Mapping
```
Key: socket_to_address
Type: Hash
Fields:
  - {socketId}: "0x..."
```

---

## Example Flow

### Complete Student-Tutor Matching Flow

```javascript
// 1. Tutor goes online
socket.emit("tutor:setAvailable", {
  address: "0xTUTOR",
  language: "spanish",
  ratePerSecond: 100000
});

// 2. Student requests tutor
socket.emit("student:request-tutor", {
  requestId: "req_123",
  studentAddress: "0xSTUDENT",
  language: "spanish",
  budgetPerSecond: 150000
});

// 3. Tutor receives request
socket.on("tutor:incoming-request", (data) => {
  // Show request to tutor
});

// 4. Tutor accepts
socket.emit("tutor:accept-request", {
  requestId: "req_123",
  tutorAddress: "0xTUTOR"
});

// 5. Student receives acceptance
socket.on("student:tutor-accepted", (data) => {
  // Show tutor details to student
});

// 6. Student accepts tutor
socket.emit("student:accept-tutor", {
  requestId: "req_123",
  tutorAddress: "0xTUTOR",
  studentAddress: "0xSTUDENT"
});

// 7. Tutor receives selection
socket.on("tutor:student-selected", (data) => {
  // Wait for blockchain transaction
});

// 8. Student starts session on blockchain
// (calls startSession() smart contract function)

// 9. Student confirms session started
socket.emit("session:started", {
  requestId: "req_123",
  tutorAddress: "0xTUTOR",
  studentAddress: "0xSTUDENT",
  videoCallUrl: "https://..."
});

// 10. Student enters WebRTC room
socket.emit("student:entered-room", {
  requestId: "req_123",
  tutorAddress: "0xTUTOR",
  studentAddress: "0xSTUDENT",
  videoCallUrl: "https://..."
});

// 11. Tutor receives notification
socket.on("student:in-room", (data) => {
  // Join WebRTC room
});

// 12. Session happens...

// 13. Either party ends session
// (WebRTC server calls backend, backend calls endSession() on blockchain)

// 14. Both parties return to search
```

---

## Troubleshooting

### Socket Not Connecting
- Check CORS settings in backend
- Verify Socket.io client version matches server
- Check network/firewall settings

### Events Not Received
- Verify socket is connected: `socket.connected`
- Check if socket ID is bound: emit `user:connect` first
- Check rate limiting (10 req/min)

### Tutor Not Receiving Requests
- Verify tutor called `tutor:setAvailable`
- Check language matching (must be exact match)
- Check rate matching (tutor rate <= student budget)
- Verify socket is still connected

### Student Not Receiving Acceptances
- Verify request was stored (check Redis)
- Check if student socket is still connected
- Verify student socket ID is correct

---

## Testing

### Manual Testing with Socket.io Client

```javascript
const io = require("socket.io-client");
const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected:", socket.id);
  
  // Test tutor availability
  socket.emit("tutor:setAvailable", {
    address: "0x1234...",
    language: "spanish",
    ratePerSecond: 100000
  }, (response) => {
    console.log("Response:", response);
  });
});

socket.on("error", (error) => {
  console.error("Error:", error);
});
```

### Testing with Browser Console

```javascript
// In browser console (if Socket.io client is loaded)
const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected!");
});

socket.emit("student:request-tutor", {
  requestId: "test_" + Date.now(),
  studentAddress: "0xtest",
  language: "spanish",
  budgetPerSecond: 150000
});
```

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md) - System architecture
- [WebRTC Integration](../guides/webrtc-integration.md) - Video call integration
- [Language Matching Fix](../guides/language-matching-fix.md) - Known language matching issue

---

**Last Updated:** November 10, 2025
