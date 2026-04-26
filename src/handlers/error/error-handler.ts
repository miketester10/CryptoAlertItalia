import { AxiosError } from "axios";
import { code, format, TelegramError } from "gramio";
import { logger } from "../../logger/logger";
import { CoinGeckoHttpErrorResponse } from "../../interfaces/coingecko-error-response.interface";
import { MyCallbackQueryContext, MyMessageContext } from "../../types/custom-context.type";
import { replyOrEdit } from "../bot/02-commands-helper";

export const errorHandler = async (error: unknown, ctx: MyMessageContext | MyCallbackQueryContext): Promise<void> => {
  const defaultErrorMessage = format`${code("❌ Si e verificato un errore. Riprova piu tardi.")}`;

  if (error instanceof TelegramError && error.message.includes("message is not modified")) {
    await (ctx as MyCallbackQueryContext).answerCallbackQuery();
    logger.error(`Telegram Error: ${error.message}`);
    return;
  }

  if (error instanceof AxiosError) {
    const responseData = error.response?.data as CoinGeckoHttpErrorResponse | undefined;
    const message = responseData?.status?.error_message ?? responseData?.error ?? error.message;
    const status = error.response?.status ?? "Unknown";
    logger.error(`Axios Error: Status ${status} - Message: ${message}`);
  } else {
    logger.error(`Unknown Error: ${(error as Error).message}`);
  }

  try {
    await replyOrEdit(ctx, defaultErrorMessage);
  } catch (replyError) {
    logger.error(`Invio del messaggio di errore a Telegram non riuscito: ${(replyError as Error).message}`);
  }
};
