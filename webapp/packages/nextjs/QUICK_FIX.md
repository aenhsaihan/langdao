# 🚀 Quick Fix - Get Thirdweb Client ID (2 minutes)

## Step-by-Step (Super Fast)

### 1. Open Thirdweb Dashboard

👉 https://thirdweb.com/dashboard/settings/api-keys

### 2. Sign In

- Click "Sign In"
- Use Google, GitHub, or Email (fastest is Google/GitHub)
- No credit card needed, completely free

### 3. Create API Key

- Click "Create API Key" button
- Give it a name like "LangDAO Dev"
- Click "Create"
- Copy the Client ID (starts with something like `abc123...`)

### 4. Update .env.local

Open `webapp/packages/nextjs/.env.local` and replace:

```bash
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_copied_client_id_here
```

### 5. Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd webapp/packages/nextjs
npm run dev
```

### 6. Refresh Browser

Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

## ✅ Done!

Your app should now:

- Recognize registered wallets
- Read contract data properly
- Show your student/tutor dashboard
- No more "dummy client" errors

---

**Why is this needed?**
Thirdweb provides free RPC infrastructure to read/write blockchain data. Without a valid client ID, the app can't communicate with the blockchain to check if you're registered.
