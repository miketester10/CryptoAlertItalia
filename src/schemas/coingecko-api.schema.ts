import { z } from "zod";

export const coinGeckoCoinSchema = z.object({
  id: z.string().trim().min(1),
  symbol: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.toLowerCase()),
  name: z.string().trim().min(1),
});

export const coinGeckoCoinListResponseSchema = z.array(coinGeckoCoinSchema);

export const coinGeckoSimplePriceItemSchema = z.object({
  usd: z.number(),
});

export const coinGeckoSimplePriceResponseSchema = z.record(
  z.string(),
  coinGeckoSimplePriceItemSchema,
);

export type CoinGeckoCoinListItemResponse = z.infer<typeof coinGeckoCoinSchema>;
export type CoinGeckoSimplePriceResponse = z.infer<typeof coinGeckoSimplePriceResponseSchema>;
