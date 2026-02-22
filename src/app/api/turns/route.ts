import { NextRequest, NextResponse } from "next/server";
import { getRecentTurns, getTurnCount, getToolCalls } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const turnId = searchParams.get("turnId");

    if (turnId) {
      // Return tool calls for a specific turn
      const toolCalls = getToolCalls(turnId);
      return NextResponse.json({ toolCalls });
    }

    const turns = getRecentTurns(limit, offset);
    const total = getTurnCount();

    return NextResponse.json({
      turns,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "턴 조회 실패" },
      { status: 500 }
    );
  }
}
