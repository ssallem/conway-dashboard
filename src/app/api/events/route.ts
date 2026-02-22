import { NextResponse } from "next/server";
import {
  getAgentState,
  getRecentTurns,
  getTurnCount,
  getTotalCost,
  isDbAvailable,
} from "@/lib/db";
import { getCreditsBalance } from "@/lib/conway-api";
import { getUsdcBalance } from "@/lib/usdc";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const walletAddress = process.env.AGENT_WALLET_ADDRESS || "";

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial state
      try {
        const state = getAgentState();
        const [creditsCents, usdcBalance] = await Promise.all([
          getCreditsBalance(),
          walletAddress ? getUsdcBalance(walletAddress) : Promise.resolve(0),
        ]);
        const turnCount = getTurnCount();
        const totalCostCents = getTotalCost();
        const dbAvailable = isDbAvailable();

        const initEvent = {
          type: "init",
          data: { state, creditsCents, usdcBalance, turnCount, totalCostCents, dbAvailable },
          timestamp: new Date().toISOString(),
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(initEvent)}\n\n`)
        );
      } catch {
        // ignore init errors
      }

      // Poll for changes every 5 seconds
      let lastTurnCount = 0;
      let lastState = "";
      let lastCreditsCents = -1;

      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }

        try {
          const currentState = getAgentState();
          const currentTurnCount = getTurnCount();

          // State change event
          if (lastState && currentState !== lastState) {
            const event = {
              type: "state_change",
              data: { from: lastState, to: currentState },
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
            );
          }

          // New turn event (only if DB is available)
          if (isDbAvailable() && lastTurnCount > 0 && currentTurnCount > lastTurnCount) {
            const newTurns = getRecentTurns(
              currentTurnCount - lastTurnCount
            );
            for (const turn of newTurns) {
              const event = {
                type: "turn",
                data: turn,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            }
          }

          // Credits polling (always works - cloud or local)
          try {
            const creditsCents = await getCreditsBalance();
            if (lastCreditsCents >= 0 && creditsCents !== lastCreditsCents) {
              const event = {
                type: "credits_update",
                data: { creditsCents },
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            }
            lastCreditsCents = creditsCents;
          } catch {
            // ignore credits polling errors
          }

          lastState = currentState;
          lastTurnCount = currentTurnCount;

          // Heartbeat
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`
            )
          );
        } catch {
          // ignore polling errors
        }
      }, 5000);

      // Cleanup when connection closes
      const cleanup = () => {
        closed = true;
        clearInterval(interval);
      };

      // Set a timeout to close the stream after 30 minutes
      setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // ignore
        }
      }, 30 * 60 * 1000);
    },
    cancel() {
      closed = true;
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
