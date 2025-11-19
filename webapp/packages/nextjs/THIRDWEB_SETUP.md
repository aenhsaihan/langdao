# Thirdweb Client ID Setup

## Issue
You're seeing a "dummy client" error because the Thirdweb client ID is not properly configured.

## Quick Fix

### Step 1: Get a Free Thirdweb Client ID

1. Go to https://thirdweb.com/dashboard/settings/api-keys
2. Sign in or create a free account
3. Create a new API key / Client ID
4. Copy the Client ID

### Step 2: Update Your Environment File

1. Open `webapp/packages/nextjs/.env.local`
2. Replace the dummy value:

```bash
# Before:
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=dummy_client_id

# After (use your actual client ID):
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_actual_client_id_here
```

### Step 3: Restart Your Dev Server

```bash
cd webapp/packages/nextjs
npm run dev
```

## Why This Is Needed

Thirdweb uses the client ID to:
- Make RPC calls to blockchain networks
- Read contract data (like checking if users are registered)
- Enable wallet connections
- Provide better rate limits and reliability

Without a valid client ID, the app cannot read from or write to smart contracts.

## Alternative: Use Alchemy RPC Directly

If you don't want to use Thirdweb's RPC, you can configure the app to use Alchemy directly, but you'll need to modify the client configuration.
