import { z } from "zod";

export const coinSearchResultSchema = z.object({
  id: z.string().trim().min(1),
  symbol: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const coinSearchResultsSchema = z.array(coinSearchResultSchema).min(1);

export type CoinSearchResult = z.infer<typeof coinSearchResultSchema>;
