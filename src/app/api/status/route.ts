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
import { getCreditsBalance, getTransactionHistory } from "@/lib/conway-api";
import { getUsdcBalance } from "@/lib/usdc";
import type { DashboardStatus, Transaction } from "@/types/automaton";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = loadAutomatonConfig();
    const walletAddress =
      process.env.AGENT_WALLET_ADDRESS || config?.walletAddress || "";

    // Parallel fetch for remote data (Conway API + USDC balance + transaction history)
    const [creditsCents, usdcBalance, apiTransactions] = await Promise.all([
      getCreditsBalance(),
      getUsdcBalance(walletAddress),
      getTransactionHistory(20).catch(() => null),
    ]);

    // DB queries (synchronous)
    const agentState = getAgentState();
    const turnCount = getTurnCount();
    const totalCostCents = getTotalCost();
    const heartbeats = getHeartbeatEntries();
    const children = getChildren();
    const recentTurns = getRecentTurns(20);
    const costByHour = getCostByHour();

    // Transactions: Conway API first, DB fallback
    let recentTransactions: Transaction[];
    const mapTx = (t: any): Transaction => ({
      id: t.id,
      type: t.type,
      amountCents: t.amount_cents ?? undefined,
      balanceAfterCents: t.balance_after_cents ?? undefined,
      description: t.description || "",
      timestamp: t.created_at || "",
    });

    const txList = apiTransactions?.transactions ?? apiTransactions?.items ?? (Array.isArray(apiTransactions) ? apiTransactions : null);
    if (txList && Array.isArray(txList)) {
      recentTransactions = txList.map(mapTx);
    } else {
      recentTransactions = getRecentTransactions(20);
    }

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
