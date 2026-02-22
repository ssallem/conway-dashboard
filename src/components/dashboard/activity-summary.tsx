"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, Zap, Clock, DollarSign } from "lucide-react";

interface ActivitySummaryProps {
  summary?: {
    avgCostPerTurnCents: number;
    totalTurnsToday: number;
    mostActiveHour: string;
    totalCostTodayCents: number;
  };
  totalApiTransactions?: number;
  isLoading?: boolean;
}

export function ActivitySummary({
  summary,
  totalApiTransactions,
  isLoading,
}: ActivitySummaryProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-3">
              <div className="animate-pulse h-10 bg-zinc-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      icon: <Activity className="h-3.5 w-3.5 text-blue-400" />,
      label: "오늘 턴 수",
      value: `${summary.totalTurnsToday}턴`,
      sub: totalApiTransactions
        ? `전체 ${totalApiTransactions}턴`
        : undefined,
    },
    {
      icon: <DollarSign className="h-3.5 w-3.5 text-emerald-400" />,
      label: "오늘 비용",
      value: `$${(summary.totalCostTodayCents / 100).toFixed(2)}`,
    },
    {
      icon: <Zap className="h-3.5 w-3.5 text-yellow-400" />,
      label: "평균 턴 비용",
      value: `$${(summary.avgCostPerTurnCents / 100).toFixed(4)}`,
    },
    {
      icon: <Clock className="h-3.5 w-3.5 text-purple-400" />,
      label: "최다 활동 시간",
      value: summary.mostActiveHour,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <Card key={i} className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              {item.icon}
              {item.label}
            </div>
            <p className="text-sm font-bold text-zinc-100">{item.value}</p>
            {item.sub && (
              <p className="text-xs text-zinc-600">{item.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
