"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

interface CreditTopupDialogProps {
  onTopup?: () => void;
}

export function CreditTopupDialog({ onTopup }: CreditTopupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleTopup = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/credits/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://api.conway.tech/v1/credits/topup",
          amount: 100,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult("충전이 완료되었습니다!");
        onTopup?.();
      } else {
        setResult(data.message || data.error || "충전에 실패했습니다.");
      }
    } catch (err: any) {
      setResult(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Coins className="h-4 w-4 mr-1" />
          크레딧 충전
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Conway 크레딧 충전</DialogTitle>
          <DialogDescription className="text-zinc-400">
            x402 프로토콜을 통해 USDC로 크레딧을 충전합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
            <p className="text-sm text-zinc-300 mb-3">
              충전은 에이전트 지갑의 USDC를 사용하여 자동으로 처리됩니다.
              현재 Base 메인넷의 USDC만 지원합니다.
            </p>
            <div className="text-xs text-zinc-500 space-y-1">
              <p>네트워크: Base (eip155:8453)</p>
              <p>결제 방식: x402 TransferWithAuthorization</p>
            </div>
          </div>
          <Button
            onClick={handleTopup}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? "처리 중..." : "충전하기"}
          </Button>
          {result && (
            <p
              className={`text-sm ${
                result.includes("완료")
                  ? "text-emerald-400"
                  : "text-zinc-400"
              }`}
            >
              {result}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
