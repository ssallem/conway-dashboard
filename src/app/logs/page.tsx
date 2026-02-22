"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useLogs } from "@/hooks/use-status";
import { useEventStream } from "@/hooks/use-event-stream";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Eye, Cloud } from "lucide-react";
import type { Turn, ApiLog } from "@/types/automaton";

function formatTime(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleString("ko-KR");
  } catch {
    return timestamp;
  }
}

function TurnDetail({ turn }: { turn: Turn }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            턴 {turn.id.slice(0, 8)}...
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-zinc-500">시간:</span>{" "}
              <span className="text-zinc-300">
                {formatTime(turn.timestamp)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">상태:</span>{" "}
              <Badge variant="outline" className="text-xs ml-1">
                {turn.state}
              </Badge>
            </div>
            <div>
              <span className="text-zinc-500">비용:</span>{" "}
              <span className="text-zinc-300">
                ${(turn.costCents / 100).toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">입력 소스:</span>{" "}
              <span className="text-zinc-300">
                {turn.inputSource || "-"}
              </span>
            </div>
          </div>

          {turn.input && (
            <div>
              <h4 className="text-xs text-zinc-500 mb-1 uppercase">
                입력
              </h4>
              <pre className="text-xs text-zinc-300 bg-zinc-800 p-3 rounded-lg overflow-auto max-h-32 whitespace-pre-wrap">
                {turn.input}
              </pre>
            </div>
          )}

          <div>
            <h4 className="text-xs text-zinc-500 mb-1 uppercase">
              사고 과정
            </h4>
            <pre className="text-xs text-zinc-300 bg-zinc-800 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
              {turn.thinking || "(없음)"}
            </pre>
          </div>

          {turn.toolCalls.length > 0 && (
            <div>
              <h4 className="text-xs text-zinc-500 mb-1 uppercase">
                도구 호출 ({turn.toolCalls.length})
              </h4>
              <div className="space-y-2">
                {turn.toolCalls.map((tc, i) => (
                  <div
                    key={i}
                    className={`bg-zinc-800 p-3 rounded-lg border ${
                      tc.error
                        ? "border-red-500/30"
                        : "border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-200 font-mono font-semibold">
                        {tc.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {tc.durationMs}ms
                      </span>
                    </div>
                    <pre className="text-[10px] text-zinc-400 overflow-auto max-h-24 whitespace-pre-wrap">
                      {JSON.stringify(tc.arguments, null, 2)}
                    </pre>
                    {tc.error && (
                      <p className="text-[10px] text-red-400 mt-1">
                        오류: {tc.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs text-zinc-500 mb-1 uppercase">
              토큰 사용량
            </h4>
            <div className="text-xs text-zinc-400 grid grid-cols-3 gap-2">
              <div>
                입력: {turn.tokenUsage?.promptTokens?.toLocaleString() || 0}
              </div>
              <div>
                출력:{" "}
                {turn.tokenUsage?.completionTokens?.toLocaleString() || 0}
              </div>
              <div>
                합계: {turn.tokenUsage?.totalTokens?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function typeBadgeColor(type: string): string {
  switch (type) {
    case "inference":
      return "text-blue-400 border-blue-500/30";
    case "tool_use":
      return "text-purple-400 border-purple-500/30";
    case "credit_check":
      return "text-emerald-400 border-emerald-500/30";
    case "transfer_in":
      return "text-green-400 border-green-500/30";
    case "transfer_out":
      return "text-orange-400 border-orange-500/30";
    case "funding_request":
      return "text-yellow-400 border-yellow-500/30";
    default:
      return "text-zinc-400 border-zinc-600";
  }
}

export default function LogsPage() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { source, turns, logs, total, isLoading, refresh } = useLogs(
    pageSize,
    page * pageSize
  );
  const { connected } = useEventStream();

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      <Header
        agentName="로그"
        connected={connected}
        onRefresh={() => refresh()}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        {/* API mode notice banner */}
        {source === "api" && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2.5">
            <Cloud className="h-4 w-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-300">
              클라우드 모드: 간략 활동 로그 (상세 로그는 로컬에서 확인)
            </p>
          </div>
        )}

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-300">
                활동 로그 ({total}건)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="h-7 w-7"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-zinc-500">
                  {page + 1} / {totalPages || 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setPage(Math.min(totalPages - 1, page + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="h-7 w-7"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-220px)]">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 bg-zinc-800" />
                  ))}
                </div>
              ) : source === "api" ? (
                /* ── API Mode: Credit history table ── */
                logs.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    활동 기록이 없습니다
                  </p>
                ) : (
                  <div className="space-y-1">
                    {/* Table Header */}
                    <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-zinc-600 uppercase tracking-wider">
                      <span className="w-32 shrink-0">시간</span>
                      <span className="w-24 shrink-0">유형</span>
                      <span className="flex-1">모델</span>
                      <span className="w-20 shrink-0 text-right">비용</span>
                      <span className="w-20 shrink-0 text-right">잔액</span>
                    </div>
                    {logs.map((log: ApiLog) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50 px-3 py-2 hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-[10px] text-zinc-600 font-mono w-32 shrink-0">
                          {formatTime(log.timestamp)}
                        </span>
                        <span className="w-24 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${typeBadgeColor(log.type)}`}
                          >
                            {log.type}
                          </Badge>
                        </span>
                        <span className="text-xs text-zinc-400 truncate flex-1">
                          {log.model || "-"}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono w-20 shrink-0 text-right">
                          ${((log.costCents ?? 0) / 100).toFixed(4)}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono w-20 shrink-0 text-right">
                          ${((log.balanceAfterCents ?? 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* ── DB Mode: Full turn details (existing behavior) ── */
                turns.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    턴 기록이 없습니다
                  </p>
                ) : (
                  <div className="space-y-1">
                    {turns.map((turn: Turn) => (
                      <div
                        key={turn.id}
                        className="flex items-center gap-3 rounded-lg bg-zinc-800/30 border border-zinc-800/50 px-3 py-2 hover:bg-zinc-800/50 transition-colors"
                      >
                        <span className="text-[10px] text-zinc-600 font-mono w-32 shrink-0">
                          {formatTime(turn.timestamp)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            turn.state === "running"
                              ? "text-emerald-400 border-emerald-500/30"
                              : turn.state === "critical" || turn.state === "dead"
                                ? "text-red-400 border-red-500/30"
                                : "text-zinc-400 border-zinc-600"
                          }`}
                        >
                          {turn.state}
                        </Badge>
                        <span className="text-xs text-zinc-400 truncate flex-1">
                          {turn.thinking
                            ? turn.thinking.slice(0, 100)
                            : "(사고 없음)"}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono shrink-0">
                          ${(turn.costCents / 100).toFixed(3)}
                        </span>
                        <span className="text-[10px] text-zinc-600 shrink-0">
                          {turn.toolCalls.length}건
                        </span>
                        <TurnDetail turn={turn} />
                      </div>
                    ))}
                  </div>
                )
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
