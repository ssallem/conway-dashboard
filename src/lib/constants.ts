export const INITIAL_CREDITS_CENTS = 3000;
export const INITIAL_USDC_DOLLARS = 143.0;
export const INITIAL_INVESTMENT_CENTS = 17300;

export function getInitialInvestment() {
  return {
    creditsCents: parseInt(process.env.INITIAL_CREDITS_CENTS || "3000", 10),
    usdcDollars: parseFloat(process.env.INITIAL_USDC_DOLLARS || "143.0"),
    get totalCents() {
      return this.creditsCents + Math.round(this.usdcDollars * 100);
    },
  };
}
