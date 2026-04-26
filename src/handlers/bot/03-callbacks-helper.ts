import { Bot, InlineKeyboard, TelegramParams, code } from "gramio";
import { DatabaseHandler } from "../database/database-handler";
import { errorHandler } from "../error/error-handler";
import {
  cancelDeleteAlert,
  cancelDeleteAllAlerts,
  currentPriceFromActiveAlert,
  deleteAlert,
  deleteAllAlerts,
  openAlertDetails,
  refreshSelectedPrice,
  selectSearchResult,
} from "./04-callbacks-data";
import { handleAlertsAttiviCommand, handleSearchSelection, renderAlertDetails, renderCurrentPriceFromAlert } from "./02-commands-helper";

const databaseHandler = DatabaseHandler.getInstance();

export const setupCallbacks = (bot: Bot): void => {
  bot.callbackQuery(selectSearchResult, async (ctx) => {
    await handleSearchSelection(ctx, ctx.queryData.sessionId, ctx.queryData.resultIndex);
    return ctx.answer();
  });

  bot.callbackQuery(refreshSelectedPrice, async (ctx) => {
    await handleSearchSelection(ctx, ctx.queryData.sessionId, ctx.queryData.resultIndex, { refreshOnly: true });
    return ctx.answer();
  });

  bot.callbackQuery(openAlertDetails, async (ctx) => {
    await renderAlertDetails(ctx, ctx.queryData.alertId);
    return ctx.answer();
  });

  bot.callbackQuery(deleteAlert, async (ctx) => {
    try {
      const alert = await databaseHandler.findAlertById(ctx.queryData.alertId);

      if (!alert || alert.userTelegramId !== ctx.from.id) {
        await ctx.editText(code("❌ Alert non trovato."));
        return ctx.answer();
      }

      await databaseHandler.deleteAlertById(alert.id);
      await handleAlertsAttiviCommand(ctx);
    } catch (error) {
      await errorHandler(error, ctx);
    }

    return ctx.answer();
  });

  bot.callbackQuery(cancelDeleteAlert, async (ctx) => {
    try {
      await handleAlertsAttiviCommand(ctx);
    } catch (error) {
      await errorHandler(error, ctx);
    }

    return ctx.answer();
  });

  bot.callbackQuery(deleteAllAlerts, async (ctx) => {
    try {
      await databaseHandler.deleteAllAlertsByTelegramId(ctx.from.id);
      await ctx.editText(code("✅ Tutti gli alert sono stati eliminati con successo."));
    } catch (error) {
      await errorHandler(error, ctx);
    }

    return ctx.answer();
  });

  bot.callbackQuery(cancelDeleteAllAlerts, async (ctx) => {
    try {
      await ctx.editText(code("❌ Comando annullato. Nessun alert e stato eliminato."));
    } catch (error) {
      await errorHandler(error, ctx);
    }

    return ctx.answer();
  });

  bot.callbackQuery(currentPriceFromActiveAlert, async (ctx) => {
    await renderCurrentPriceFromAlert(ctx, ctx.queryData.alertId);
    return ctx.answer();
  });
};
