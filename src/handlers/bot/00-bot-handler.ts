import { Bot } from "gramio";
import { logger } from "../../logger/logger";
import { MyMessageContext } from "../../types/custom-context.type";
import { handleHelpCommand, handleStartCommand } from "./01-commands-basic.helper";
import { handleAlertCommand, handleAlertsAttiviCommand, handleEliminaAlertsCommand, handlePrezzoCommand } from "./02-commands-helper";
import { setupCallbacks } from "./03-callbacks-helper";
import { userHandler } from "./05-user-handler";

export class BotHandler {
  private readonly BOT_TOKEN: string = process.env.BOT_TOKEN ?? "";

  private static _instance: BotHandler;
  readonly bot: Bot;

  private constructor() {
    if (!this.BOT_TOKEN) {
      throw new Error("BOT_TOKEN non configurato");
    }

    this.bot = new Bot(this.BOT_TOKEN);
  }

  static getInstance(): BotHandler {
    if (!BotHandler._instance) {
      BotHandler._instance = new BotHandler();
    }

    return BotHandler._instance;
  }

  async start(): Promise<void> {
    await this.initializeCommands();
    await this.bot.start();

    const menuInitialized = await this.initializeMenu();

    if (!menuInitialized) {
      logger.warn("⚠️ Bot Telegram avviato senza menu inizializzato");
    }

    logger.info("✅ Bot Telegram avviato con successo");
  }

  async stop(): Promise<void> {
    await this.bot.stop();
    logger.info("✅ Bot Telegram fermato");
  }

  private async initializeMenu(): Promise<boolean> {
    try {
      return await this.bot.api.setMyCommands({
        commands: [
          {
            command: "prezzo",
            description: "<symbol> - Prezzo attuale in USD",
          },
          {
            command: "alert",
            description: "<symbol> <prezzo> - Registra alert",
          },
          {
            command: "alerts_attivi",
            description: "Lista alert attivi",
          },
          {
            command: "elimina_alerts",
            description: "Elimina tutti gli alert attivi",
          },
          { command: "start", description: "Avvia il bot" },
          { command: "help", description: "Mostra i comandi disponibili" },
        ],
      });
    } catch (error) {
      logger.error(`Errore durante il settaggio dei comandi: ${(error as Error).message}`);
      return false;
    }
  }

  private async initializeCommands(): Promise<void> {
    this.bot.on(["message", "callback_query"], async (ctx, next) => {
      await userHandler(ctx);
      return next();
    });

    this.bot.command("prezzo", async (ctx: MyMessageContext) => {
      await handlePrezzoCommand(ctx);
    });

    this.bot.command("alert", async (ctx: MyMessageContext) => {
      await handleAlertCommand(ctx);
    });

    this.bot.command("alerts_attivi", async (ctx: MyMessageContext) => {
      await handleAlertsAttiviCommand(ctx);
    });

    this.bot.command("elimina_alerts", async (ctx: MyMessageContext) => {
      await handleEliminaAlertsCommand(ctx);
    });

    this.bot.command("start", async (ctx: MyMessageContext) => {
      await handleStartCommand(ctx);
    });

    this.bot.command("help", async (ctx: MyMessageContext) => {
      await handleHelpCommand(ctx);
    });

    setupCallbacks(this.bot);
  }
}
