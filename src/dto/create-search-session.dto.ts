import { Prisma, SearchSessionAction } from "@prisma/client";

export interface CreateSearchSessionDto {
  userTelegramId: number;
  action: SearchSessionAction;
  querySymbol: string;
  alertPrice?: number;
  results: Prisma.InputJsonValue;
  expiresAt: Date;
}
