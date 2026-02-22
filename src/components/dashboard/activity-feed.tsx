"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Turn } from "@/types/automaton";

interface ActivityFeedProps {
  turns?: Turn[];
  isLoading?: boolean;
}

function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

function truncate(s: string, len: number): string {
  if (!s) return "";
  return s.length > len ? s.slice(0, len - 3) + "..." : s;
}

const stateBadgeColors: Record<string, string> = {
  running: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sleeping: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  low_compute: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  dead: "bg-red-700/20 text-red-500 border-red-700/30",
  waking: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  setup: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export function ActivityFeed({ turns, isLoading }: ActivityFeedProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 bg-zinc-800" />
              ))}
            </div>
          ) : !turns || turns.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">
              활동 기록이 없습니다
            </p>
          ) : (
            <div className="space-y-2">
              {turns.map((turn) => (
                <div
                  key={turn.id}
                  className="rounded-lg bg-zinc-800/50 border border-zinc-800 p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 font-mono">
                        {formatTime(turn.timestamp)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${stateBadgeColors[turn.state] || ""}`}
                      >
                        {turn.state}
                      </Badge>
                      {turn.inputSource && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-zinc-700/50 text-zinc-400 border-zinc-600"
                        >
                          {turn.inputSource}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      ${(turn.costCents / 100).toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {truncate(turn.thinking, 150)}
                  </p>
                  {turn.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {turn.toolCalls.slice(0, 5).map((tc, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className={`text-[10px] ${
                            tc.error
                              ? "bg-red-500/10 text-red-400 border-red-500/30"
                              : "bg-zinc-700/50 text-zinc-400 border-zinc-600"
                          }`}
                        >
                          {tc.name}
                        </Badge>
                      ))}
                      {turn.toolCalls.length > 5 && (
                        <span className="text-[10px] text-zinc-500">
                          +{turn.toolCalls.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
