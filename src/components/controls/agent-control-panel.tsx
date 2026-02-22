"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditTopupDialog } from "./credit-topup-dialog";
import type { HeartbeatEntry, ChildAutomaton } from "@/types/automaton";

interface AgentControlPanelProps {
  walletAddress?: string;
  sandboxId?: string;
  version?: string;
  inferenceModel?: string;
  heartbeats?: HeartbeatEntry[];
  children?: ChildAutomaton[];
  onRefresh?: () => void;
}

function shortAddress(addr: string): string {
  if (!addr) return "없음";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function AgentControlPanel({
  walletAddress,
  sandboxId,
  version,
  inferenceModel,
  heartbeats,
  children,
  onRefresh,
}: AgentControlPanelProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300">
            에이전트 정보
          </CardTitle>
          <CreditTopupDialog onTopup={onRefresh} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">지갑</span>
            <span className="text-zinc-300 font-mono text-xs">
              {shortAddress(walletAddress || "")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">샌드박스</span>
            <span className="text-zinc-300 font-mono text-xs">
              {sandboxId ? sandboxId.slice(0, 12) + "..." : "없음"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">버전</span>
            <span className="text-zinc-300">{version || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">추론 모델</span>
            <span className="text-zinc-300">{inferenceModel || "-"}</span>
          </div>
        </div>

        {/* Heartbeat Entries */}
        {heartbeats && heartbeats.length > 0 && (
          <>
            <Separator className="bg-zinc-800" />
            <div>
              <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                하트비트 스케줄
              </h4>
              <div className="space-y-1.5">
                {heartbeats.map((hb) => (
                  <div
                    key={hb.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          hb.enabled ? "bg-emerald-400" : "bg-zinc-600"
                        }`}
                      />
                      <span className="text-zinc-300">{hb.name}</span>
                    </div>
                    <span className="text-zinc-500 font-mono">
                      {hb.schedule}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Children */}
        {children && children.length > 0 && (
          <>
            <Separator className="bg-zinc-800" />
            <div>
              <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">
                자식 에이전트
              </h4>
              <div className="space-y-1.5">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-zinc-300">{child.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        child.status === "running"
                          ? "text-emerald-400 border-emerald-500/30"
                          : child.status === "dead"
                            ? "text-red-400 border-red-500/30"
                            : "text-zinc-400 border-zinc-600"
                      }`}
                    >
                      {child.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
