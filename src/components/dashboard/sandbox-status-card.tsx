"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Server } from "lucide-react";

interface SandboxStatusCardProps {
  sandboxId?: string;
  detail?: {
    id: string;
    status: string;
    created_at?: string;
    cpu?: number;
    memory_mb?: number;
    [key: string]: unknown;
  };
  isLoading?: boolean;
}

export function SandboxStatusCard({
  sandboxId,
  detail,
  isLoading,
}: SandboxStatusCardProps) {
  const statusColor = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "running":
        return "bg-emerald-500";
      case "stopped":
        return "bg-red-500";
      case "starting":
        return "bg-yellow-500";
      default:
        return "bg-zinc-500";
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Server className="h-4 w-4" />
          샌드박스 상태
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">상태</span>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full ${statusColor(
                detail?.status
              )}`}
            />
            <span className="text-sm text-zinc-200">
              {detail?.status || "알 수 없음"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">ID</span>
          <span className="text-xs text-zinc-400 font-mono">
            {sandboxId ? sandboxId.slice(0, 12) + "..." : "-"}
          </span>
        </div>
        {detail?.cpu && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">CPU</span>
            <span className="text-sm text-zinc-300">
              {detail.cpu} vCPU
            </span>
          </div>
        )}
        {detail?.memory_mb && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">메모리</span>
            <span className="text-sm text-zinc-300">
              {detail.memory_mb} MB
            </span>
          </div>
        )}
        {detail?.created_at && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">생성일</span>
            <span className="text-xs text-zinc-400">
              {new Date(detail.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
