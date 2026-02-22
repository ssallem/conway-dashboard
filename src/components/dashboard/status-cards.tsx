"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Coins,
  BarChart3,
  Activity,
} from "lucide-react";

interface StatusCardsProps {
  creditsCents?: number;
  usdcBalance?: number;
  turnCount?: number;
  totalCostCents?: number;
  isLoading?: boolean;
}

export function StatusCards({
  creditsCents,
  usdcBalance,
  turnCount,
  totalCostCents,
  isLoading,
}: StatusCardsProps) {
  const cards = [
    {
      title: "Conway 크레딧",
      value: creditsCents !== undefined
        ? `$${(creditsCents / 100).toFixed(2)}`
        : "-",
      sub:
        creditsCents !== undefined
          ? `${creditsCents} cents`
          : "",
      icon: Coins,
      color: "text-emerald-400",
    },
    {
      title: "USDC 잔액",
      value: usdcBalance !== undefined
        ? `${usdcBalance.toFixed(4)}`
        : "-",
      sub: "Base Mainnet",
      icon: Wallet,
      color: "text-blue-400",
    },
    {
      title: "총 턴 수",
      value: turnCount !== undefined ? turnCount.toLocaleString() : "-",
      sub: "전체 실행 턴",
      icon: Activity,
      color: "text-purple-400",
    },
    {
      title: "총 비용",
      value: totalCostCents !== undefined
        ? `$${(totalCostCents / 100).toFixed(2)}`
        : "-",
      sub: "누적 추론 비용",
      icon: BarChart3,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="bg-zinc-900 border-zinc-800"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24 bg-zinc-800" />
            ) : (
              <>
                <div className="text-2xl font-bold text-zinc-100">
                  {card.value}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{card.sub}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
