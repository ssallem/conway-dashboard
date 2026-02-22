import { NextResponse } from "next/server";
import { loadAutomatonConfig } from "@/lib/config";
import {
  getAgentState,
  getRecentTurns,
  getTurnCount,
  getTotalCost,
  getHeartbeatEntries,
  getChildren,
  getRecentTransactions,
  getCostByHour,
} from "@/lib/db";
import { getCreditsBalance } from "@/lib/conway-api";
import { getUsdcBalance } from "@/lib/usdc";
import type { DashboardStatus } from "@/types/automaton";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = loadAutomatonConfig();
    const walletAddress =
      process.env.AGENT_WALLET_ADDRESS || config?.walletAddress || "";

    // Parallel fetch for remote data
    const [creditsCents, usdcBalance] = await Promise.all([
      getCreditsBalance(),
      getUsdcBalance(walletAddress),
    ]);

    // DB queries (synchronous)
    const agentState = getAgentState();
    const turnCount = getTurnCount();
    const totalCostCents = getTotalCost();
    const heartbeats = getHeartbeatEntries();
    const children = getChildren();
    const recentTurns = getRecentTurns(20);
    const recentTransactions = getRecentTransactions(20);
    const costByHour = getCostByHour();

    const status: DashboardStatus = {
      agentName: config?.name || "automaton",
      agentState,
      walletAddress,
      sandboxId: process.env.SANDBOX_ID || config?.sandboxId || "",
      creditsCents,
      usdcBalance,
      turnCount,
      totalCostCents,
      uptime: "",
      version: config?.version || "0.1.0",
      inferenceModel: config?.inferenceModel || "unknown",
      heartbeats,
      children,
      recentTurns,
      recentTransactions,
      costByHour,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "상태 조회 실패" },
      { status: 500 }
    );
  }
}
