import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, amount } = body;

    if (!url || !amount) {
      return NextResponse.json(
        { error: "url과 amount가 필요합니다" },
        { status: 400 }
      );
    }

    // x402 payment flow:
    // 1. Make initial request to the URL
    const initialResp = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (initialResp.status !== 402) {
      return NextResponse.json({
        success: true,
        message: "결제가 필요하지 않습니다 (402 아님)",
        status: initialResp.status,
      });
    }

    // 2. Parse payment requirements from 402 response
    const paymentHeader = initialResp.headers.get("X-Payment-Required");
    if (!paymentHeader) {
      return NextResponse.json(
        { error: "결제 요구사항을 파싱할 수 없습니다" },
        { status: 400 }
      );
    }

    // Note: Full x402 signing requires the wallet private key
    // This is a simplified version - in production, the agent handles this
    return NextResponse.json({
      success: false,
      message:
        "x402 결제는 에이전트 런타임에서 직접 처리합니다. Conway API를 통해 크레딧을 충전하세요.",
      paymentRequired: paymentHeader,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "충전 실패" },
      { status: 500 }
    );
  }
}
