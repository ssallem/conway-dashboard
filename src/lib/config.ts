import { readFileSync } from "fs";
import { join } from "path";

const CONFIG_DIR =
  process.env.AUTOMATON_CONFIG_DIR || "C:\\Users\\mellass\\.automaton";

export interface AutomatonJsonConfig {
  name: string;
  genesisPrompt: string;
  creatorAddress: string;
  sandboxId: string;
  conwayApiUrl: string;
  conwayApiKey: string;
  inferenceModel: string;
  maxTokensPerTurn: number;
  walletAddress: string;
  version: string;
  maxChildren: number;
  registeredWithConway: boolean;
  [key: string]: unknown;
}

export interface ApiConfig {
  apiKey: string;
  walletAddress: string;
  provisionedAt: string;
}

export function loadAutomatonConfig(): AutomatonJsonConfig | null {
  try {
    const raw = readFileSync(join(CONFIG_DIR, "automaton.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadApiConfig(): ApiConfig | null {
  try {
    const raw = readFileSync(join(CONFIG_DIR, "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getApiKey(): string {
  return process.env.CONWAY_API_KEY || loadApiConfig()?.apiKey || "";
}

export function getWalletPrivateKey(): string {
  // 1. Environment variable (for cloud/Vercel)
  if (process.env.WALLET_PRIVATE_KEY) {
    return process.env.WALLET_PRIVATE_KEY;
  }
  // 2. Local wallet.json file
  try {
    const raw = readFileSync(join(CONFIG_DIR, "wallet.json"), "utf-8");
    const data = JSON.parse(raw);
    return data.privateKey || "";
  } catch {
    return "";
  }
}
