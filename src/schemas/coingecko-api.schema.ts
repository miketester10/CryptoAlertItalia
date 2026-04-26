import { z } from "zod";

export const coinGeckoCoinSchema = z.object({
  id: z.string().trim().min(1),
  symbol: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1),
});

export const coinGeckoCoinListResponseSchema = z.array(coinGeckoCoinSchema);

export const coinGeckoSimplePriceItemSchema = z.object({
  usd: z.number().finite(),
});

export const coinGeckoSimplePriceResponseSchema = z.record(z.string(), coinGeckoSimplePriceItemSchema);

export type CoinGeckoCoinListItemResponse = z.output<typeof coinGeckoCoinSchema>;
export type CoinGeckoSimplePriceItemResponse = z.infer<typeof coinGeckoSimplePriceItemSchema>;
export type CoinGeckoSimplePriceResponse = z.infer<typeof coinGeckoSimplePriceResponseSchema>;
