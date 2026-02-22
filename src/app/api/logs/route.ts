import { NextRequest, NextResponse } from "next/server";
import { getRecentTurns, getTurnCount } from "@/lib/db";
import { getCreditHistory } from "@/lib/conway-api";

export const dynamic = "force-dynamic";

function extractModel(description: string): string {
  const match = description?.match(/Inference:\s*(.+)/i);
  return match?.[1]?.trim() || "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Try DB first (richer data with thinking, tool_calls)
  const turns = getRecentTurns(limit, offset);
  const total = getTurnCount();

  if (turns.length > 0) {
    return NextResponse.json({ source: "db", turns, total, limit, offset });
  }

  // Cloud fallback: Conway API credit history
  const { transactions, total: apiTotal } = await getCreditHistory(limit, offset);

  const logs = transactions.map((t: any) => ({
    id: t.id,
    timestamp: t.created_at,
    type: t.type,
    costCents: Math.abs(t.amount_cents || 0),
    balanceAfterCents: t.balance_after_cents,
    description: t.description || "",
    model: extractModel(t.description),
  }));

  return NextResponse.json({ source: "api", logs, total: apiTotal, limit, offset });
}
