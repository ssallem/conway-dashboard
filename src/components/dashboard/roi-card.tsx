"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Flame,
  Target,
} from "lucide-react";

interface ROICardProps {
  creditsCents?: number;
  usdcBalance?: number;
  roi?: {
    initialInvestmentCents: number;
    initialCreditsCents: number;
    initialUsdcDollars: number;
    currentValueCents: number;
    netChangeCents: number;
    roiPercent: number;
    burnRateCentsPerHour: number;
    runwayHours: number;
    creditDepletionPercent: number;
  };
  isLoading?: boolean;
}

export function ROICard({
  creditsCents,
  usdcBalance,
  roi,
  isLoading,
}: ROICardProps) {
  // Format helpers
  const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const isPositive = (roi?.netChangeCents ?? 0) >= 0;
  const runwayText =
    !roi || roi.runwayHours < 0
      ? "\u221E"
      : roi.runwayHours < 1
        ? `${Math.round(roi.runwayHours * 60)}\uBD84`
        : `${Math.round(roi.runwayHours)}\uC2DC\uAC04`;

  if (isLoading || !roi) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            수익성 분석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-zinc-800 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Target className="h-4 w-4" />
          수익성 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {/* Initial Investment */}
          <div>
            <p className="text-xs text-zinc-500">초기 투자</p>
            <p className="text-lg font-bold text-zinc-100">
              {fmt(roi.initialInvestmentCents)}
            </p>
          </div>
          {/* Current Value */}
          <div>
            <p className="text-xs text-zinc-500">현재 가치</p>
            <p className="text-lg font-bold text-zinc-100">
              {fmt(roi.currentValueCents)}
            </p>
          </div>
          {/* Net Change */}
          <div>
            <p className="text-xs text-zinc-500">순 변동</p>
            <p
              className={`text-lg font-bold flex items-center gap-1 ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? "+" : ""}
              {fmt(roi.netChangeCents)}
            </p>
          </div>
          {/* ROI % */}
          <div>
            <p className="text-xs text-zinc-500">ROI</p>
            <p
              className={`text-lg font-bold ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? "+" : ""}
              {roi.roiPercent.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Burn Rate & Runway */}
        <div className="flex items-center gap-6 mb-3 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span>연소율:</span>
            <span className="text-zinc-200 font-medium">
              {fmt(roi.burnRateCentsPerHour)}/hr
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            <span>잔여 시간:</span>
            <span className="text-zinc-200 font-medium">{runwayText}</span>
          </div>
        </div>

        {/* Credit Depletion Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>크레딧 소진율</span>
            <span>{roi.creditDepletionPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                roi.creditDepletionPercent > 80
                  ? "bg-red-500"
                  : roi.creditDepletionPercent > 50
                    ? "bg-orange-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(100, roi.creditDepletionPercent)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
