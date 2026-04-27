import { Alert } from "@prisma/client";

export interface AlertGroup {
  coinId: string;
  symbol: string;
  name: string;
  alerts: Alert[];
}
