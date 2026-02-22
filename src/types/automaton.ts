// ─── Agent State ─────────────────────────────────────────────────

export type AgentState =
  | "setup"
  | "waking"
  | "running"
  | "sleeping"
  | "low_compute"
  | "critical"
  | "dead";

export type InputSource =
  | "heartbeat"
  | "creator"
  | "agent"
  | "system"
  | "wakeup";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result: string;
  durationMs: number;
  error?: string;
}

export interface Turn {
  id: string;
  timestamp: string;
  state: AgentState;
  input?: string;
  inputSource?: InputSource;
  thinking: string;
  toolCalls: ToolCallResult[];
  tokenUsage: TokenUsage;
  costCents: number;
}

// ─── Financial ───────────────────────────────────────────────────

export type TransactionType =
  | "credit_check"
  | "inference"
  | "tool_use"
  | "transfer_in"
  | "transfer_out"
  | "funding_request";

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents?: number;
  balanceAfterCents?: number;
  description: string;
  timestamp: string;
}

// ─── Heartbeat ───────────────────────────────────────────────────

export interface HeartbeatEntry {
  name: string;
  schedule: string;
  task: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  params?: Record<string, unknown>;
}

// ─── Children ────────────────────────────────────────────────────

export type ChildStatus =
  | "spawning"
  | "running"
  | "sleeping"
  | "dead"
  | "unknown";

export interface ChildAutomaton {
  id: string;
  name: string;
  address: string;
  sandboxId: string;
  genesisPrompt: string;
  creatorMessage?: string;
  fundedAmountCents: number;
  status: ChildStatus;
  createdAt: string;
  lastChecked?: string;
}

// ─── Dashboard Status ────────────────────────────────────────────

export interface DashboardStatus {
  agentName: string;
  agentState: AgentState;
  walletAddress: string;
  sandboxId: string;
  creditsCents: number;
  usdcBalance: number;
  turnCount: number;
  totalCostCents: number;
  uptime: string;
  version: string;
  inferenceModel: string;
  heartbeats: HeartbeatEntry[];
  children: ChildAutomaton[];
  recentTurns: Turn[];
  recentTransactions: Transaction[];
  costByHour: { hour: string; cost: number }[];
  timestamp: string;
  // Extended fields
  roi?: ROIData;
  activitySummary?: ActivitySummary;
  sandboxDetail?: SandboxDetail;
  balanceHistory?: { timestamp: string; balanceCents: number }[];
  totalApiTransactions?: number;
}

// ─── SSE Event ───────────────────────────────────────────────────

export interface SSEEvent {
  type: "turn" | "tool_call" | "state_change" | "transaction" | "heartbeat";
  data: unknown;
  timestamp: string;
}

// ─── Conway API Extended Types ──────────────────────────────────

export interface CreditTransaction {
  id: string;
  type: string;
  amount_cents: number;
  balance_after_cents: number;
  description: string;
  created_at: string;
}

export interface SandboxDetail {
  id: string;
  status: string;
  created_at?: string;
  cpu?: number;
  memory_mb?: number;
  [key: string]: unknown;
}

// ─── ROI Types ──────────────────────────────────────────────────

export interface ROIData {
  initialInvestmentCents: number;
  initialCreditsCents: number;
  initialUsdcDollars: number;
  currentValueCents: number;
  netChangeCents: number;
  roiPercent: number;
  burnRateCentsPerHour: number;
  runwayHours: number;
  creditDepletionPercent: number;
}

export interface ActivitySummary {
  avgCostPerTurnCents: number;
  totalTurnsToday: number;
  mostActiveHour: string;
  totalCostTodayCents: number;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  type: string;
  costCents: number;
  balanceAfterCents: number;
  description: string;
  model: string;
}
