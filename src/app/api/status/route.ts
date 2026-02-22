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
import { getCreditsBalance, getTransactionHistory, getCreditHistory, getSandboxDetail } from "@/lib/conway-api";
import { getUsdcBalance } from "@/lib/usdc";
import { getInitialInvestment } from "@/lib/constants";
import type { DashboardStatus, Transaction } from "@/types/automaton";
import type { ROIData, ActivitySummary } from "@/types/automaton";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = loadAutomatonConfig();
    const walletAddress =
      process.env.AGENT_WALLET_ADDRESS || config?.walletAddress || "";

    // Parallel fetch for remote data (Conway API + USDC balance + transaction history)
    const [creditsCents, usdcBalance, apiTransactions, sandboxDetail, creditHistoryRaw] =
      await Promise.all([
        getCreditsBalance(),
        getUsdcBalance(walletAddress),
        getTransactionHistory(20).catch(() => null),
        getSandboxDetail().catch(() => null),
        getCreditHistory(100, 0).catch(() => ({ transactions: [], total: 0 })),
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

    // ROI computation
    const investment = getInitialInvestment();
    const currentValueCents = creditsCents + Math.round(usdcBalance * 100);
    const netChangeCents = currentValueCents - investment.totalCents;
    const burnRateCentsPerHour = computeBurnRate(creditHistoryRaw.transactions);
    const runwayHours = creditsCents === 0 ? 0 : burnRateCentsPerHour > 0 ? creditsCents / burnRateCentsPerHour : -1;
    const creditDepletionPercent = Math.min(100, Math.max(0,
      ((investment.creditsCents - creditsCents) / investment.creditsCents) * 100
    ));

    const roi: ROIData = {
      initialInvestmentCents: investment.totalCents,
      initialCreditsCents: investment.creditsCents,
      initialUsdcDollars: investment.usdcDollars,
      currentValueCents,
      netChangeCents,
      roiPercent: investment.totalCents > 0 ? (netChangeCents / investment.totalCents) * 100 : 0,
      burnRateCentsPerHour,
      runwayHours,
      creditDepletionPercent,
    };

    // Activity summary
    const activitySummary = computeActivitySummary(creditHistoryRaw.transactions);

    // Balance history
    const balanceHistory = creditHistoryRaw.transactions
      .filter((t: any) => t.balance_after_cents !== undefined)
      .map((t: any) => ({ timestamp: t.created_at, balanceCents: t.balance_after_cents }))
      .reverse();

    // Cost by hour from API (fallback when DB unavailable)
    const costByHourApi = computeCostByHourFromApi(creditHistoryRaw.transactions);

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
      costByHour: costByHour.length > 0 ? costByHour : costByHourApi,
      timestamp: new Date().toISOString(),
      roi,
      activitySummary,
      sandboxDetail,
      balanceHistory,
      totalApiTransactions: creditHistoryRaw.total,
    };

    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "상태 조회 실패" },
      { status: 500 }
    );
  }
}

function computeBurnRate(transactions: any[]): number {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const recent = transactions.filter((t: any) => {
    const ts = new Date(t.created_at).getTime();
    return (now - ts) < h24 && t.amount_cents < 0;
  });
  if (recent.length === 0) return 0;
  if (recent.length === 1) {
    const elapsed = now - new Date(recent[0].created_at).getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);
    return elapsedHours > 0 ? Math.abs(recent[0].amount_cents) / elapsedHours : 0;
  }
  const totalSpent = recent.reduce((sum: number, t: any) => sum + Math.abs(t.amount_cents), 0);
  const timestamps = recent.map((t: any) => new Date(t.created_at).getTime());
  const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
  const spanHours = spanMs / (1000 * 60 * 60);
  return spanHours > 0 ? totalSpent / spanHours : 0;
}

function computeActivitySummary(transactions: any[]): ActivitySummary {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayTxns = transactions.filter((t: any) =>
    t.created_at?.startsWith(todayStr) && t.type === "inference"
  );
  const totalTurnsToday = todayTxns.length;
  const totalCostTodayCents = todayTxns.reduce(
    (sum: number, t: any) => sum + Math.abs(t.amount_cents || 0), 0
  );
  const avgCostPerTurnCents = totalTurnsToday > 0 ? totalCostTodayCents / totalTurnsToday : 0;
  const hourCounts: Record<string, number> = {};
  for (const t of todayTxns) {
    const hour = t.created_at?.slice(11, 13) + ":00";
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  const mostActiveHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  return { avgCostPerTurnCents, totalTurnsToday, mostActiveHour, totalCostTodayCents };
}

function computeCostByHourFromApi(transactions: any[]): { hour: string; cost: number }[] {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  for (const t of transactions) {
    if (t.amount_cents >= 0) continue;
    const ts = new Date(t.created_at).getTime();
    if (now - ts > h24) continue;
    const hour = t.created_at.slice(0, 13) + ":00";
    buckets[hour] = (buckets[hour] || 0) + Math.abs(t.amount_cents);
  }
  return Object.entries(buckets)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([hour, cost]) => ({ hour, cost }));
}
