export const API = {
  COINGECKO_COIN_LIST: "https://api.coingecko.com/api/v3/coins/list",
  COINGECKO_SIMPLE_PRICE: "https://api.coingecko.com/api/v3/simple/price",
  USD_CURRENCY: "usd",
} as const;

export const MAX_SEARCH_RESULTS = 12;
export const SEARCH_SESSION_TTL_MINUTES = 15;
