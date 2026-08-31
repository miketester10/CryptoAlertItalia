import { Prisma } from "@prisma/client";

export interface UpdateAlertDto
  extends Pick<Prisma.AlertUpdateInput, "lastCondition" | "lastCheckPrice"> {
  id: string;
}
