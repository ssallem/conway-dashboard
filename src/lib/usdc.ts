const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const USDC_CONTRACT =
  process.env.USDC_CONTRACT || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export async function getUsdcBalance(walletAddress: string): Promise<number> {
  try {
    // balanceOf(address) selector = 0x70a08231
    const addressPadded = walletAddress
      .slice(2)
      .toLowerCase()
      .padStart(64, "0");
    const callData = "0x70a08231" + addressPadded;

    const res = await fetch(BASE_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: USDC_CONTRACT, data: callData }, "latest"],
      }),
      cache: "no-store",
    });

    if (!res.ok) return 0;
    const data = await res.json();
    if (data.error) return 0;

    // USDC has 6 decimals
    const rawBal = BigInt(data.result || "0x0");
    return Number(rawBal) / 1_000_000;
  } catch {
    return 0;
  }
}
