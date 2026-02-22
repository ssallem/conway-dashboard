import { existsSync } from "fs";
import type {
  Turn,
  ToolCallResult,
  HeartbeatEntry,
  Transaction,
  ChildAutomaton,
  AgentState,
} from "@/types/automaton";

let _db: any = null;

function getDb(): any | null {
  if (_db) return _db;

  const dbPath =
    process.env.AUTOMATON_DB_PATH || "";

  // No DB path configured or file doesn't exist -> return null (cloud mode)
  if (!dbPath || !existsSync(dbPath)) return null;

  try {
    // Dynamic require to avoid build errors when better-sqlite3 is not installed
    const Database = require("better-sqlite3");
    _db = new Database(dbPath, { readonly: true, fileMustExist: true });
    _db.pragma("journal_mode = WAL");
    return _db;
  } catch {
    // better-sqlite3 not available (e.g. Vercel serverless)
    return null;
  }
}

function safeQuery<T>(fn: () => T, fallback: T): T {
  try {
    const db = getDb();
    if (!db) return fallback;
    return fn();
  } catch {
    // DB may not exist or table may not exist
    _db = null;
    return fallback;
  }
}

// ─── DB availability check ──────────────────────────────────────

export function isDbAvailable(): boolean {
  return getDb() !== null;
}

// ─── Agent State ─────────────────────────────────────────────────

export function getAgentState(): AgentState {
  return safeQuery(() => {
    const db = getDb();
    const row = db
      .prepare("SELECT value FROM kv WHERE key = ?")
      .get("agent_state") as { value: string } | undefined;
    return (row?.value as AgentState) || "setup";
  }, "setup" as AgentState);
}

// ─── Turns ───────────────────────────────────────────────────────

export function getRecentTurns(limit = 20, offset = 0): Turn[] {
  return safeQuery(() => {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT * FROM turns ORDER BY timestamp DESC LIMIT ? OFFSET ?"
      )
      .all(limit, offset) as any[];
    return rows.map(deserializeTurn);
  }, []);
}

export function getTurnCount(): number {
  return safeQuery(() => {
    const db = getDb();
    const row = db
      .prepare("SELECT COUNT(*) as count FROM turns")
      .get() as { count: number };
    return row.count;
  }, 0);
}

export function getTotalCost(): number {
  return safeQuery(() => {
    const db = getDb();
    const row = db
      .prepare("SELECT COALESCE(SUM(cost_cents), 0) as total FROM turns")
      .get() as { total: number };
    return row.total;
  }, 0);
}

// ─── Tool Calls ──────────────────────────────────────────────────

export function getToolCalls(turnId?: string, limit = 50): ToolCallResult[] {
  return safeQuery(() => {
    const db = getDb();
    if (turnId) {
      const rows = db
        .prepare("SELECT * FROM tool_calls WHERE turn_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(turnId, limit) as any[];
      return rows.map(deserializeToolCall);
    }
    const rows = db
      .prepare("SELECT * FROM tool_calls ORDER BY created_at DESC LIMIT ?")
      .all(limit) as any[];
    return rows.map(deserializeToolCall);
  }, []);
}

// ─── KV Store ────────────────────────────────────────────────────

export function getAllKV(): Record<string, string> {
  return safeQuery(() => {
    const db = getDb();
    const rows = db.prepare("SELECT key, value FROM kv").all() as {
      key: string;
      value: string;
    }[];
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }, {});
}

// ─── Heartbeat ───────────────────────────────────────────────────

export function getHeartbeatEntries(): HeartbeatEntry[] {
  return safeQuery(() => {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM heartbeat_entries").all() as any[];
    return rows.map(deserializeHeartbeatEntry);
  }, []);
}

// ─── Children ────────────────────────────────────────────────────

export function getChildren(): ChildAutomaton[] {
  return safeQuery(() => {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM children ORDER BY created_at DESC")
      .all() as any[];
    return rows.map(deserializeChild);
  }, []);
}

// ─── Transactions ────────────────────────────────────────────────

export function getRecentTransactions(limit = 50): Transaction[] {
  return safeQuery(() => {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?"
      )
      .all(limit) as any[];
    return rows.map(deserializeTransaction);
  }, []);
}

// ─── Cost by Hour (for chart) ────────────────────────────────────

export function getCostByHour(): { hour: string; cost: number }[] {
  return safeQuery(() => {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT strftime('%Y-%m-%d %H:00', timestamp) as hour,
                SUM(cost_cents) as cost
         FROM turns
         WHERE timestamp >= datetime('now', '-24 hours')
         GROUP BY hour
         ORDER BY hour ASC`
      )
      .all() as { hour: string; cost: number }[];
    return rows.map((r) => ({
      hour: r.hour,
      cost: r.cost || 0,
    }));
  }, []);
}

// ─── Deserializers ───────────────────────────────────────────────

function deserializeTurn(row: any): Turn {
  return {
    id: row.id,
    timestamp: row.timestamp,
    state: row.state,
    input: row.input ?? undefined,
    inputSource: row.input_source ?? undefined,
    thinking: row.thinking,
    toolCalls: JSON.parse(row.tool_calls || "[]"),
    tokenUsage: JSON.parse(row.token_usage || "{}"),
    costCents: row.cost_cents,
  };
}

function deserializeToolCall(row: any): ToolCallResult {
  return {
    id: row.id,
    name: row.name,
    arguments: JSON.parse(row.arguments || "{}"),
    result: row.result,
    durationMs: row.duration_ms,
    error: row.error ?? undefined,
  };
}

function deserializeHeartbeatEntry(row: any): HeartbeatEntry {
  return {
    name: row.name,
    schedule: row.schedule,
    task: row.task,
    enabled: !!row.enabled,
    lastRun: row.last_run ?? undefined,
    nextRun: row.next_run ?? undefined,
    params: JSON.parse(row.params || "{}"),
  };
}

function deserializeTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amountCents: row.amount_cents ?? undefined,
    balanceAfterCents: row.balance_after_cents ?? undefined,
    description: row.description,
    timestamp: row.created_at,
  };
}

function deserializeChild(row: any): ChildAutomaton {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    sandboxId: row.sandbox_id,
    genesisPrompt: row.genesis_prompt,
    creatorMessage: row.creator_message ?? undefined,
    fundedAmountCents: row.funded_amount_cents,
    status: row.status,
    createdAt: row.created_at,
    lastChecked: row.last_checked ?? undefined,
  };
}
