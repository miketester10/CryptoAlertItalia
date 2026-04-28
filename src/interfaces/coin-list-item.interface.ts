import { Coin } from "@prisma/client";

export interface CoinListItem extends Omit<Coin, "createdAt" | "updatedAt"> {}
