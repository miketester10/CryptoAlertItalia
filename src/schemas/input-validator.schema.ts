import { z } from "zod";
import { CommandType } from "../enums/command-type.enum";

const symbolSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Il simbolo non puo essere vuoto")
  .max(30, "Il simbolo e troppo lungo")
  .regex(/^[^\s/]+$/, "Il simbolo contiene caratteri non validi");

const alertPriceSchema = z
  .string()
  .trim()
  .nonempty("Il prezzo non puo essere vuoto")
  .transform((value, ctx) => {
    const parsedValue = Number(value);

    if (!Number.isFinite(parsedValue)) {
      ctx.addIssue({ code: "custom", message: "Il prezzo deve essere un numero valido" });
      return z.NEVER;
    }

    return parsedValue;
  })
  .refine((value) => value > 0, "Il prezzo deve essere maggiore di zero");

const alertSchema = z.object({
  symbol: symbolSchema,
  alertPrice: alertPriceSchema,
});

export type SymbolValidated = z.infer<typeof symbolSchema>;
export type AlertValidated = z.infer<typeof alertSchema>;

type ValidateResult<T> = { success: true; data: T } | { success: false; errors: string[] };

export function validateInput(command: CommandType.PREZZO, symbol: string | undefined): ValidateResult<SymbolValidated>;
export function validateInput(
  command: CommandType.ALERT,
  symbol: string | undefined,
  alertPrice: string | undefined,
): ValidateResult<AlertValidated>;
export function validateInput(
  command: CommandType,
  symbol: string | undefined,
  alertPrice?: string,
): ValidateResult<SymbolValidated | AlertValidated> {
  if (command === CommandType.PREZZO) {
    const result = symbolSchema.safeParse(symbol);

    if (!result.success) {
      return { success: false, errors: result.error.issues.map((issue) => issue.message) };
    }

    return { success: true, data: result.data };
  }

  if (command === CommandType.ALERT) {
    if (!alertPrice) {
      return { success: false, errors: ["Il prezzo e richiesto per il comando /alert"] };
    }

    const result = alertSchema.safeParse({ symbol, alertPrice });

    if (!result.success) {
      return { success: false, errors: result.error.issues.map((issue) => issue.message) };
    }

    return { success: true, data: result.data };
  }

  return { success: false, errors: ["Comando non supportato"] };
}
