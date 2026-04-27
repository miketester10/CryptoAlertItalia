import { Bot, InlineKeyboard, TelegramParams, code } from "gramio";
import { DatabaseHandler } from "../database/database-handler";
import { errorHandler } from "../error/error-handler";
import {
  backToAlertGroups,
  cancelDeleteAllAlerts,
  currentPriceFromActiveAlert,
  deleteAlert,
  deleteAllAlerts,
  openAlertDetails,
  openAlertGroup,
  refreshSelectedPrice,
  selectSearchResult,
} from "./04-callbacks-data";
import { handleAlertsAttiviCommand, handleSearchSelection, renderAlertDetails, renderAlertGroupCommand, renderCurrentPriceFromAlert } from "./02-commands-helper";

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

  bot.callbackQuery(openAlertGroup, async (ctx) => {
    await renderAlertGroupCommand(ctx, ctx.queryData.coinId);
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

      const remainingAlerts = await databaseHandler.findAllAlertsByTelegramId(ctx.from.id);
      const hasSameCoinAlerts = remainingAlerts.some((remainingAlert) => remainingAlert.coinId === alert.coinId);

      if (hasSameCoinAlerts) {
        await renderAlertGroupCommand(ctx, alert.coinId);
      } else {
        await handleAlertsAttiviCommand(ctx);
      }
    } catch (error) {
      await errorHandler(error, ctx);
    }

    return ctx.answer();
  });

  bot.callbackQuery(backToAlertGroups, async (ctx) => {
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
