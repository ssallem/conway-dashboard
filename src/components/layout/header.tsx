"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Menu } from "lucide-react";
import type { AgentState } from "@/types/automaton";
import { cn } from "@/lib/utils";

interface HeaderProps {
  agentName?: string;
  agentState?: AgentState;
  connected?: boolean;
  onRefresh?: () => void;
}

const stateColors: Record<AgentState, string> = {
  setup: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  waking: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  running: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  sleeping: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  low_compute: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  dead: "bg-red-700/20 text-red-500 border-red-700/30",
  stopped: "bg-zinc-600/20 text-zinc-300 border-zinc-500/30",
};

const stateLabels: Record<AgentState, string> = {
  setup: "설정 중",
  waking: "기동 중",
  running: "실행 중",
  sleeping: "대기 중",
  low_compute: "저전력",
  critical: "위험",
  dead: "중단됨",
  stopped: "수동 중단",
};

export function Header({
  agentName,
  agentState,
  connected,
  onRefresh,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-zinc-100">
          {agentName || "Automaton"}
        </h1>
        {agentState && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              stateColors[agentState]
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block h-2 w-2 rounded-full",
                agentState === "running"
                  ? "bg-emerald-400 animate-pulse"
                  : agentState === "dead" || agentState === "critical"
                    ? "bg-red-500"
                    : agentState === "stopped"
                      ? "bg-zinc-400"
                      : "bg-zinc-400"
              )}
            />
            {stateLabels[agentState]}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mr-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              connected
                ? "bg-emerald-400 animate-pulse"
                : "bg-zinc-600"
            )}
          />
          {connected ? "실시간 연결" : "연결 끊김"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
