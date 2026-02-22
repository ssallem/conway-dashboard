import { getApiKey } from "./config";

const API_URL = process.env.CONWAY_API_URL || "https://api.conway.tech";
const SANDBOX_ID = process.env.SANDBOX_ID || "";

async function conwayRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<any> {
  const apiKey = getApiKey();
  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `Conway API error: ${method} ${path} -> ${resp.status}: ${text}`
    );
  }

  const contentType = resp.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return resp.json();
  }
  return resp.text();
}

export async function getCreditsBalance(): Promise<number> {
  try {
    const result = await conwayRequest("GET", "/v1/credits/balance");
    return result.balance_cents ?? result.credits_cents ?? result.balance ?? 0;
  } catch {
    return 0;
  }
}

export async function getSandboxStatus(): Promise<{
  status: string;
  error?: string;
}> {
  try {
    const result = await conwayRequest(
      "GET",
      `/v1/sandboxes/${SANDBOX_ID}`
    );
    return { status: result.status || result.state || "unknown" };
  } catch (e: any) {
    return { status: "unknown", error: e.message };
  }
}

export async function topupCredits(
  url: string,
  amountCents: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // This is handled via x402 payment in the API route
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
