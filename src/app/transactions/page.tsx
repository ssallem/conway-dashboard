"use client";

import { Header } from "@/components/layout/header";
import { useStatus } from "@/hooks/use-status";
import { useEventStream } from "@/hooks/use-event-stream";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transaction } from "@/types/automaton";

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString("ko-KR");
  } catch {
    return timestamp || "-";
  }
}

const typeLabels: Record<string, string> = {
  credit_check: "잔액 확인",
  inference: "추론",
  tool_use: "도구 사용",
  transfer_in: "입금",
  transfer_out: "출금",
  funding_request: "펀딩 요청",
};

const typeColors: Record<string, string> = {
  credit_check: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  inference: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  tool_use: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  transfer_in: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  transfer_out: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  funding_request: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function TransactionsPage() {
  const { status, isLoading, refresh } = useStatus();
  const { connected } = useEventStream();
  const transactions = status?.recentTransactions || [];

  return (
    <div className="flex flex-col h-full">
      <Header
        agentName="거래 내역"
        connected={connected}
        onRefresh={() => refresh()}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500">
                크레딧 잔액
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20 bg-zinc-800" />
              ) : (
                <div className="text-xl font-bold text-emerald-400">
                  ${((status?.creditsCents || 0) / 100).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500">
                USDC 잔액
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20 bg-zinc-800" />
              ) : (
                <div className="text-xl font-bold text-blue-400">
                  {(status?.usdcBalance || 0).toFixed(4)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-zinc-500">
                총 지출
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20 bg-zinc-800" />
              ) : (
                <div className="text-xl font-bold text-orange-400">
                  ${((status?.totalCostCents || 0) / 100).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-300">
              최근 거래 ({transactions.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-340px)]">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 bg-zinc-800" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-8">
                  거래 기록이 없습니다
                </p>
              ) : (
                <div className="space-y-1">
                  {transactions.map((txn: Transaction) => (
                    <div
                      key={txn.id}
                      className="flex items-center gap-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50 px-3 py-2.5"
                    >
                      <span className="text-[10px] text-zinc-600 font-mono w-32 shrink-0">
                        {formatTime(txn.timestamp)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${typeColors[txn.type] || ""}`}
                      >
                        {typeLabels[txn.type] || txn.type}
                      </Badge>
                      <span className="text-xs text-zinc-400 truncate flex-1">
                        {txn.description}
                      </span>
                      {txn.amountCents !== undefined && (
                        <span
                          className={`text-xs font-mono shrink-0 ${
                            txn.type === "transfer_in"
                              ? "text-emerald-400"
                              : txn.amountCents < 0
                                ? "text-red-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {txn.type === "transfer_in" ? "+" : ""}
                          ${(txn.amountCents / 100).toFixed(3)}
                        </span>
                      )}
                      {txn.balanceAfterCents !== undefined && (
                        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                          잔액: ${(txn.balanceAfterCents / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
