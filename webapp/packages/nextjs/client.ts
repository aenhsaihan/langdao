import { createThirdwebClient } from "thirdweb";

// Create thirdweb client
// Get a free client ID from https://thirdweb.com/dashboard/settings/api-keys
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

console.log("🔑 Thirdweb Client ID loaded:", clientId ? `${clientId.substring(0, 8)}...` : "NOT SET");

if (!clientId || clientId === "dummy_client_id") {
    console.error("❌ NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set or is using dummy value!");
    console.error("📝 Get a free client ID from: https://thirdweb.com/dashboard/settings/api-keys");
    console.error("⚙️  Add it to your .env.local file");
} else {
    console.log("✅ Thirdweb client initialized successfully");
}

export const client = createThirdwebClient({
    clientId: clientId || "dummy_client_id",
})