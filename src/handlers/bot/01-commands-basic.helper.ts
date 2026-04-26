import { blockquote, bold, code, format, italic, underline } from "gramio";
import { MyMessageContext } from "../../types/custom-context.type";
import { logger } from "../../logger/logger";
import { errorHandler } from "../error/error-handler";

export const handleStartCommand = async (ctx: MyMessageContext): Promise<void> => {
  const telegramId = ctx.from?.id;
  const name = ctx.from?.firstName ?? "Trader";

  logger.info(`Bot avviato da: ${name} - Telegram ID: ${telegramId}`);

  try {
    await ctx.sendChatAction("typing");

    const message = format`
👋 Ciao ${name}

Sono ${bold("Crypto Alert Bot 🤖")}

Per vedere tutti i comandi disponibili usa:
${blockquote(code("/help"))}

${blockquote("Monitora prezzi crypto in USD, scegli il token corretto dalla coin list di CoinGecko e ricevi alert automatici ogni 2 minuti.")}`;

    await ctx.reply(message, { link_preview_options: { is_disabled: true } });
  } catch (error) {
    await errorHandler(error, ctx);
  }
};

export const handleHelpCommand = async (ctx: MyMessageContext): Promise<void> => {
  try {
    await ctx.sendChatAction("typing");

    const message = format`
${bold("📚 ELENCO DEI COMANDI")}

${blockquote(
  format`🔹${code("/prezzo <symbol>")} - Cerca il simbolo nella coin list di CoinGecko e ti fa scegliere il token corretto.
${italic("Esempio:")} ${code("/prezzo btc")}
🔹${code("/alert <symbol> <prezzo_usd>")} - Cerca il simbolo, scegli il token corretto e registra un alert bidirezionale.
${italic("Esempio:")} ${code("/alert btc 70000")}
🔹${code("/alerts_attivi")} - Mostra gli alert registrati e permette di vedere il prezzo attuale o eliminare il singolo alert.
🔹${code("/elimina_alerts")} - Elimina tutti gli alert attivi previa conferma.
🔹${code("/start")} - Avvia il bot.
🔹${code("/help")} - Mostra questo messaggio.`,
)}

ℹ️ ${underline(italic("Suggerimenti d'uso:"))}
Usa sempre il ${code("symbol")} corretto, poi seleziona il ${code("CoinGecko ID")} giusto dai pulsanti.
Il prezzo dell'alert deve usare il punto come separatore decimale.
${code("70000.50 -> corretto")}
${code("70000,50 -> errato")}`;

    await ctx.reply(message);
  } catch (error) {
    await errorHandler(error, ctx);
  }
};
