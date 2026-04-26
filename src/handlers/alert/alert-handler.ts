import { Alert, Condition } from "@prisma/client";
import { Bot, blockquote, bold, code, format, underline } from "gramio";
import { DatabaseHandler } from "../database/database-handler";
import { CoinGeckoHandler } from "../coingecko/coingecko-handler";
import { logger } from "../../logger/logger";
import { UpdateAlertDto } from "../../dto/update-alert.dto";
import { BotHandler } from "../bot/00-bot-handler";
import { formatUsdPrice } from "../../utils/price-formatter";

export class AlertHandler {
  private static _instance: AlertHandler;
  private readonly databaseHandler: DatabaseHandler = DatabaseHandler.getInstance();
  private readonly coinGeckoHandler: CoinGeckoHandler = CoinGeckoHandler.getInstance();

  private constructor() {}

  static getInstance(): AlertHandler {
    if (!AlertHandler._instance) {
      AlertHandler._instance = new AlertHandler();
    }

    return AlertHandler._instance;
  }

  private get bot(): Bot {
    return BotHandler.getInstance().bot;
  }

  async checkAndNotifyAlerts(): Promise<void> {
    const alerts = await this.databaseHandler.findAllAlerts();

    if (alerts.length === 0) {
      return;
    }

    const uniqueCoinIds = [...new Set(alerts.map((alert) => alert.coinId))];
    const currentPrices = await this.coinGeckoHandler.getCurrentPrices(uniqueCoinIds);

    for (const alert of alerts) {
      const currentPrice = currentPrices.get(alert.coinId);

      if (currentPrice === undefined) {
        logger.warn(`Prezzo non disponibile per ${alert.coinId}. Alert saltato.`);
        continue;
      }

      const newCondition = this.calculateCondition(currentPrice, alert.alertPrice);

      if (!this.shouldNotify(alert, newCondition)) {
        continue;
      }

      await this.sendNotification(alert, currentPrice, newCondition);
      await this.updateAlertStatus(alert.id, newCondition, currentPrice);
    }
  }

  calculateCondition(currentPrice: number, alertPrice: number): Condition {
    if (currentPrice > alertPrice) {
      return Condition.above;
    }

    if (currentPrice < alertPrice) {
      return Condition.below;
    }

    return Condition.equal;
  }

  private shouldNotify(alert: Alert, newCondition: Condition): boolean {
    return newCondition !== alert.lastCondition && newCondition !== Condition.equal;
  }

  private async updateAlertStatus(alertId: string, condition: Condition, price: number): Promise<void> {
    const updateAlertDto: UpdateAlertDto = {
      id: alertId,
      lastCondition: condition,
      lastCheckPrice: price,
    };

    await this.databaseHandler.updateAlert(updateAlertDto);
  }

  private async sendNotification(alert: Alert, currentPrice: number, condition: Condition): Promise<void> {
    const movementLine =
      condition === Condition.above ? format`🟢 Il prezzo ha ${bold("SUPERATO")}` : format`🔴 Il prezzo e ${bold("SCESO")} sotto`;

    const message = blockquote(
      format`🚨 ${bold(format`${underline("ALERT CRYPTO")}`)}

${bold("🪙 Coin:")} ${code(`${alert.name} (${alert.symbol.toUpperCase()})`)}
${bold("🆔 CoinGecko ID:")} ${code(alert.coinId)}
${movementLine} ${code(formatUsdPrice(alert.alertPrice))}
${bold("💰 Prezzo attuale:")} ${code(formatUsdPrice(currentPrice))}`,
    );

    await this.bot.api.sendMessage({
      chat_id: alert.userTelegramId,
      text: message,
    });
  }
}
