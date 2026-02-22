"use client";

import { useStatus } from "@/hooks/use-status";
import { useEventStream } from "@/hooks/use-event-stream";
import { Header } from "@/components/layout/header";
import { StatusCards } from "@/components/dashboard/status-cards";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { CostChart } from "@/components/dashboard/cost-chart";
import { AgentControlPanel } from "@/components/controls/agent-control-panel";

export default function DashboardPage() {
  const { status, isLoading, refresh } = useStatus();
  const { connected } = useEventStream();

  return (
    <div className="flex flex-col h-full">
      <Header
        agentName={status?.agentName}
        agentState={status?.agentState}
        connected={connected}
        onRefresh={() => refresh()}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        {/* Status Cards */}
        <StatusCards
          creditsCents={status?.creditsCents}
          usdcBalance={status?.usdcBalance}
          turnCount={status?.turnCount}
          totalCostCents={status?.totalCostCents}
          isLoading={isLoading}
        />

        {/* Main Grid */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Activity Feed - 2 cols */}
          <div className="lg:col-span-2">
            <ActivityFeed
              turns={status?.recentTurns}
              isLoading={isLoading}
            />
          </div>

          {/* Control Panel - 1 col */}
          <div className="space-y-6">
            <AgentControlPanel
              walletAddress={status?.walletAddress}
              sandboxId={status?.sandboxId}
              version={status?.version}
              inferenceModel={status?.inferenceModel}
              heartbeats={status?.heartbeats}
              children={status?.children}
              onRefresh={() => refresh()}
            />
            <CostChart data={status?.costByHour} />
          </div>
        </div>
      </main>
    </div>
  );
}
