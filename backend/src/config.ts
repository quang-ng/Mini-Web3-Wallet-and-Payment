import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
  contractAddress: process.env.PAYMENT_VAULT_ADDRESS || "",
  simpleTokenAddress: process.env.SIMPLE_TOKEN_ADDRESS || "",
  privateKey: process.env.PRIVATE_KEY || "",
};

// Validate required variables
if (!config.contractAddress) {
  throw new Error("PAYMENT_VAULT_ADDRESS is required in .env");
}
if (!config.privateKey) {
  throw new Error("PRIVATE_KEY is required in .env");
}
if (!config.simpleTokenAddress) {
  throw new Error("SIMPLE_TOKEN_ADDRESS is require in .env");
}

export default config;
