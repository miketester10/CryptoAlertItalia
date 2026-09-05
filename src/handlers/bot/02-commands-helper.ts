import { Alert, SearchSession, SearchSessionAction } from "@prisma/client";
import { FormattableString, InlineKeyboard, TelegramParams, blockquote, bold, code, format, italic, underline } from "gramio";
import { MAX_SEARCH_RESULTS, SEARCH_SESSION_TTL_MINUTES } from "../../consts/api";
import { AlertGroup } from "../../interfaces/alert-group.interface";
import { CoinListItem } from "../../interfaces/coin-list-item.interface";
import { logger } from "../../logger/logger";
import { validateInput } from "../../schemas/input-validator.schema";
import { CoinSearchResult, coinSearchResultsSchema } from "../../schemas/search-session.schema";
import { CommandType } from "../../enums/command-type.enum";
import { isCallbackContext, MyCallbackQueryContext, MyMessageContext } from "../../types/custom-context.type";
import { TelegramOptionsCustom } from "../../types/telegram-options-custom.type";
import { formatUsdPrice } from "../../utils/price-formatter";
import { DatabaseHandler } from "../database/database-handler";
import { CoinGeckoHandler } from "../coingecko/coingecko-handler";
import { AlertHandler } from "../alert/alert-handler";
import { errorHandler } from "../error/error-handler";
import {
  backToAlertDetails,
  backToAlertGroup,
  backToAlertGroups,
  cancelDeleteAllAlerts,
  deleteAlert,
  deleteAllAlerts,
  refreshSelectedPrice,
  selectSearchResult,
  viewAlertDetails,
  viewAlertGroup,
  viewCurrentPriceFromAlert,
} from "./04-callbacks-data";

const databaseHandler = DatabaseHandler.getInstance();
const coinGeckoHandler = CoinGeckoHandler.getInstance();
const alertHandler = AlertHandler.getInstance();

export const handlePrezzoCommand = async (ctx: MyMessageContext): Promise<void> => {
  const symbolRaw = ctx.update?.message?.text?.trim().split(/\s+/)[1];

  try {
    await ctx.sendChatAction("typing");

    const validation = validateInput(CommandType.PREZZO, symbolRaw);

    if (!validation.success) {
      logger.error(validation.errors);
      await ctx.reply(code("⚠️ Inserisci un simbolo valido."));
      return;
    }

    await sendCoinSelectionPrompt(ctx, validation.data, SearchSessionAction.price);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const handleAlertCommand = async (ctx: MyMessageContext): Promise<void> => {
  const [command, symbolRaw, priceRaw] = ctx.update?.message?.text?.trim().split(/\s+/) as [string, string | undefined, string | undefined];

  try {
    await ctx.sendChatAction("typing");

    const validation = validateInput(CommandType.ALERT, symbolRaw, priceRaw);

    if (!validation.success) {
      logger.error(validation.errors);
      await ctx.reply(code("⚠️ Inserisci un simbolo ed un prezzo valido."));
      return;
    }

    await sendCoinSelectionPrompt(ctx, validation.data.symbol, SearchSessionAction.alert, validation.data.alertPrice);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const handleAlertsAttiviCommand = async (ctx: MyMessageContext | MyCallbackQueryContext): Promise<void> => {
  if (!ctx.from) return;

  try {
    if (!isCallbackContext(ctx)) {
      await ctx.sendChatAction("typing");
    }

    const alerts = await databaseHandler.findAllAlertsByTelegramId(ctx.from.id);

    if (alerts.length === 0) {
      await replyOrEdit(ctx, code("⚠️ Non hai nessun alert attivo."));
      return;
    }

    alerts.sort((firstAlert, secondAlert) => {
      const symbolCompare = firstAlert.symbol.localeCompare(secondAlert.symbol);

      if (symbolCompare !== 0) {
        return symbolCompare;
      }

      return secondAlert.alertPrice - firstAlert.alertPrice;
    });

    await renderAlertGroupsList(ctx, alerts);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const renderAlertGroupCommand = async (ctx: MyCallbackQueryContext, coinId: string): Promise<void> => {
  try {
    const alerts = await databaseHandler.findAllAlertsByTelegramId(ctx.from.id);

    if (alerts.length === 0) {
      await ctx.editText(code("⚠️ Non hai nessun alert attivo."));
      return;
    }

    await renderAlertsByCoinGroup(ctx, alerts, coinId);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const handleEliminaAlertsCommand = async (ctx: MyMessageContext): Promise<void> => {
  if (!ctx.from) return;

  try {
    await ctx.sendChatAction("typing");

    const alerts = await databaseHandler.findAllAlertsByTelegramId(ctx.from.id);

    if (alerts.length === 0) {
      await ctx.reply(code("⚠️ Non hai nessun alert attivo da eliminare."));
      return;
    }

    const message = blockquote(format`${bold("⚠️ Vuoi eliminare tutti gli alert attivi?")}`);
    const replyOptions: TelegramOptionsCustom = {
      reply_markup: new InlineKeyboard().text("✅ Si", deleteAllAlerts.pack(), { style: "success" }).text("❌ No", cancelDeleteAllAlerts.pack(), { style: "danger" }),
    };

    await ctx.reply(message, replyOptions);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const handleSearchSelection = async (ctx: MyCallbackQueryContext, sessionId: string, resultIndexRaw: string, options?: { refreshOnly?: boolean }): Promise<void> => {
  try {
    const session = await getValidSearchSession(ctx, sessionId);

    if (!session) {
      return;
    }

    const resultIndex = Number(resultIndexRaw);

    if (!Number.isInteger(resultIndex) || resultIndex < 0) {
      await ctx.editText(code("⚠️ Selezione non valida."));
      return;
    }

    const results = coinSearchResultsSchema.parse(session.results);
    const selectedCoin = results[resultIndex];

    if (!selectedCoin) {
      await ctx.editText(code("⚠️ Token non trovato nella selezione."));
      return;
    }

    if (session.action === SearchSessionAction.price || options?.refreshOnly) {
      await renderCurrentPrice(ctx, session.id, resultIndex, selectedCoin);
      return;
    }

    await registerAlertFromSelection(ctx, session, selectedCoin);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const renderAlertDetails = async (ctx: MyCallbackQueryContext, alertId: string): Promise<void> => {
  try {
    const alert = await getOwnedAlert(ctx.from.id, alertId);

    if (!alert) {
      await ctx.editText(code("❌ Alert non trovato."));
      return;
    }

    const message = blockquote(
      format`⚠️ ${bold(format`${underline("DETTAGLIO ALERT")}`)}

${bold("🪙 Coin:")} ${code(alert.symbol.toUpperCase())}
${bold("🆔 CoinID:")} ${code(alert.coinId)}
${bold("🔔 Alert Price:")} ${code(formatUsdPrice(alert.alertPrice))}`,
    );

    const replyOptions: Partial<TelegramParams.EditMessageTextParams> = {
      reply_markup: new InlineKeyboard()
        .text("✅ Elimina", deleteAlert.pack({ alertId: alert.id }), { style: "success" })
        .text("💰 Prezzo attuale", viewCurrentPriceFromAlert.pack({ alertId: alert.id }), { style: "primary" })
        .row()
        .text("⬅️ Indietro", backToAlertGroup.pack({ coinId: alert.coinId }), { style: "danger" }),
    };

    await ctx.editText(message, replyOptions);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const renderCurrentPriceFromAlert = async (ctx: MyCallbackQueryContext, alertId: string): Promise<void> => {
  try {
    const alert = await getOwnedAlert(ctx.from.id, alertId);

    if (!alert) {
      await ctx.editText(code("❌ Alert non trovato."));
      return;
    }

    const price = await coinGeckoHandler.getCurrentPrice(alert.coinId);

    if (price === null) {
      await ctx.editText(code("⚠️ Prezzo non disponibile per il token selezionato."));
      return;
    }

    const message = buildPriceMessage(alert.coinId, alert.symbol, alert.name, price);
    const replyOptions: Partial<TelegramParams.EditMessageTextParams> = {
      reply_markup: new InlineKeyboard()
        .text("🔄 Aggiorna prezzo", viewCurrentPriceFromAlert.pack({ alertId: alert.id }), { style: "primary" })
        .row()
        .text("⬅️ Indietro", backToAlertDetails.pack({ alertId: alert.id }), { style: "danger" }),
    };

    await ctx.editText(message, replyOptions);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const replyOrEdit = async (ctx: MyMessageContext | MyCallbackQueryContext, text: string | FormattableString, options?: TelegramOptionsCustom): Promise<void> => {
  if (isCallbackContext(ctx)) {
    await ctx.editText(text, options as TelegramParams.EditMessageTextParams);
    return;
  }

  await ctx.reply(text, options);
};

const sendCoinSelectionPrompt = async (ctx: MyMessageContext, symbol: string, action: SearchSessionAction, alertPrice?: number): Promise<void> => {
  if (!ctx.from) return;

  const matches = await coinGeckoHandler.searchCoinsBySymbol(symbol);

  if (matches.length === 0) {
    await ctx.reply(code("⚠️ Nessun token trovato per il simbolo richiesto."));
    return;
  }

  await databaseHandler.deleteExpiredSearchSessions();

  const session = await databaseHandler.createSearchSession({
    userTelegramId: ctx.from.id,
    action,
    querySymbol: symbol,
    alertPrice,
    results: matches.map((coin) => mapCoinToSearchResult(coin)),
    expiresAt: new Date(Date.now() + SEARCH_SESSION_TTL_MINUTES * 60 * 1000),
  });

  const message = buildSelectionMessage(symbol, action, alertPrice);
  const keyboard = new InlineKeyboard();

  matches.forEach((coin, index) => {
    keyboard.text(`${coin.symbol.toUpperCase()} - ${coin.id}`, selectSearchResult.pack({ sessionId: session.id, resultIndex: String(index) }), { style: "primary" }).row();
  });

  await ctx.reply(message, { reply_markup: keyboard });
};

const buildSelectionMessage = (symbol: string, action: SearchSessionAction, alertPrice?: number): FormattableString => {
  const intro =
    action === SearchSessionAction.price
      ? "Ho trovato questi token. Premi il bottone corretto per vedere il prezzo."
      : `Ho trovato questi token. Premi il bottone corretto per registrare l'alert a ${alertPrice ? formatUsdPrice(alertPrice) : "-"}.`;

  return blockquote(
    format`🔎 ${bold(format`${underline("RISULTATI RICERCA")}`)}

${bold("Simbolo cercato:")} ${code(symbol.toUpperCase())}
${italic(intro)}`,
  );
};

const renderAlertGroupsList = async (ctx: MyMessageContext | MyCallbackQueryContext, alerts: readonly Alert[]): Promise<void> => {
  const groupedAlerts = groupAlertsByCoin(alerts);
  const keyboard = new InlineKeyboard();

  groupedAlerts.forEach((group) => {
    const buttonLabel = `${group.symbol.toUpperCase()} (${group.alerts.length})`;
    keyboard.text(buttonLabel, viewAlertGroup.pack({ coinId: group.coinId }), { style: "primary" }).row();
  });

  const message = blockquote(
    format`📋 ${bold(format`${underline("ALERT ATTIVI")}`)}

${italic("Seleziona una coin per vedere gli alert collegati.")}
${code(`Totale alert: ${alerts.length}`)}
${code(`Totale coin: ${groupedAlerts.length}`)}`,
  );

  await replyOrEdit(ctx, message, { reply_markup: keyboard });
};

const renderAlertsByCoinGroup = async (ctx: MyMessageContext | MyCallbackQueryContext, alerts: readonly Alert[], coinId: string): Promise<void> => {
  const groupedAlerts = groupAlertsByCoin(alerts);
  const selectedGroup = groupedAlerts.find((group) => group.coinId === coinId);

  if (!selectedGroup) {
    await replyOrEdit(ctx, code("❌ Gruppo alert non trovato."));
    return;
  }

  const keyboard = new InlineKeyboard();
  selectedGroup.alerts.forEach((alert, index) => {
    keyboard
      .text(`${index + 1}: ${formatUsdPrice(alert.alertPrice)}`, viewAlertDetails.pack({ alertId: alert.id }), {
        style: "primary",
      })
      .row();
  });
  keyboard.text("⬅️ Indietro", backToAlertGroups.pack(), { style: "danger" });

  const message = blockquote(
    format`🪙 ${bold(format`${underline("ALERT COIN")}`)}

${bold("Coin:")} ${code(selectedGroup.symbol.toUpperCase())}
${bold("CoinID:")} ${code(selectedGroup.coinId)}
${code(`Alert presenti: ${selectedGroup.alerts.length}`)}`,
  );

  await replyOrEdit(ctx, message, { reply_markup: keyboard });
};

const renderCurrentPrice = async (ctx: MyCallbackQueryContext, sessionId: string, resultIndex: number, selectedCoin: CoinSearchResult): Promise<void> => {
  const price = await coinGeckoHandler.getCurrentPrice(selectedCoin.id);

  if (price === null) {
    await ctx.editText(code("⚠️ Prezzo non disponibile per il token selezionato."));
    return;
  }

  const message = buildPriceMessage(selectedCoin.id, selectedCoin.symbol, selectedCoin.name, price);
  const replyOptions: Partial<TelegramParams.EditMessageTextParams> = {
    reply_markup: new InlineKeyboard().text("🔄 Aggiorna prezzo", refreshSelectedPrice.pack({ sessionId, resultIndex: String(resultIndex) }), { style: "primary" }),
  };

  await ctx.editText(message, replyOptions);
};

const registerAlertFromSelection = async (ctx: MyCallbackQueryContext, session: SearchSession, selectedCoin: CoinSearchResult): Promise<void> => {
  const price = await coinGeckoHandler.getCurrentPrice(selectedCoin.id);

  if (price === null || session.alertPrice === null) {
    await ctx.editText(code("⚠️ Impossibile registrare l'alert: prezzo attuale o alert price non disponibili."));
    return;
  }

  const existingAlert = await databaseHandler.findAlert(session.userTelegramId, selectedCoin.id, session.alertPrice);

  if (existingAlert) {
    await ctx.editText(code("⚠️ Alert gia registrato per questo token e questa soglia."));
    return;
  }

  const lastCondition = alertHandler.calculateCondition(price, session.alertPrice);

  await databaseHandler.createAlert({
    userTelegramId: session.userTelegramId,
    coinId: selectedCoin.id,
    symbol: selectedCoin.symbol,
    name: selectedCoin.name,
    alertPrice: session.alertPrice,
    lastCondition,
    lastCheckPrice: price,
  });

  await databaseHandler.deleteSearchSessionById(session.id);

  const message = blockquote(
    format`✅ ${bold(format`${underline("ALERT REGISTRATO")}`)}

${bold("🪙 Coin:")} ${code(selectedCoin.symbol.toUpperCase())}
${bold("🆔 CoinID:")} ${code(selectedCoin.id)}
${bold("🔔 Soglia:")} ${code(formatUsdPrice(session.alertPrice))}
${bold("💰 Prezzo attuale:")} ${code(formatUsdPrice(price))}`,
  );

  await ctx.editText(message);
};

const buildPriceMessage = (coinId: string, symbol: string, name: string, price: number): FormattableString => {
  return blockquote(
    format`💰 ${bold(format`${underline("PREZZO ATTUALE")}`)}

${bold("🪙 Coin:")} ${code(symbol.toUpperCase())}
${bold("🆔 CoinID:")} ${code(coinId)}
${bold("💵 Prezzo:")} ${code(formatUsdPrice(price))}`,
  );
};

const getValidSearchSession = async (ctx: MyCallbackQueryContext, sessionId: string): Promise<SearchSession | null> => {
  const session = await databaseHandler.findSearchSessionById(sessionId);

  if (!session || session.userTelegramId !== ctx.from.id) {
    await ctx.editText(code("❌ Sessione non trovata o non valida."));
    return null;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await databaseHandler.deleteSearchSessionById(session.id);
    await ctx.editText(code("⚠️ La sessione è scaduta. Ripeti il comando."));
    return null;
  }

  return session;
};

const getOwnedAlert = async (userTelegramId: number, alertId: string): Promise<Alert | null> => {
  const alert = await databaseHandler.findAlertById(alertId);

  if (!alert || alert.userTelegramId !== userTelegramId) {
    return null;
  }

  return alert;
};

const groupAlertsByCoin = (alerts: readonly Alert[]): AlertGroup[] => {
  const alertsByCoin = new Map<string, AlertGroup>();

  alerts.forEach((alert) => {
    const existingGroup = alertsByCoin.get(alert.coinId);

    if (existingGroup) {
      existingGroup.alerts.push(alert);
      return;
    }

    alertsByCoin.set(alert.coinId, {
      coinId: alert.coinId,
      symbol: alert.symbol,
      name: alert.name,
      alerts: [alert],
    });
  });

  return [...alertsByCoin.values()]
    .map((group) => ({
      ...group,
      alerts: [...group.alerts].sort((firstAlert, secondAlert) => secondAlert.alertPrice - firstAlert.alertPrice),
    }))
    .sort((firstGroup, secondGroup) => firstGroup.symbol.localeCompare(secondGroup.symbol) || firstGroup.coinId.localeCompare(secondGroup.coinId));
};

const mapCoinToSearchResult = (coin: CoinListItem): CoinSearchResult => ({
  id: coin.id,
  symbol: coin.symbol,
  name: coin.name,
});
