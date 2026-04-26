import fromExponential from "from-exponential";

export function formatUsdPrice(price: number): string {
  if (Math.abs(price) >= 1) {
    return `${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price)}$`;
  }

  return `${fromExponential(price)}$`;
}
