import { ServerHandler } from "./handlers/server/server-handler";
import { DatabaseHandler } from "./handlers/database/database-handler";
import { BotHandler } from "./handlers/bot/00-bot-handler";
// import { CoinGeckoHandler } from "./handlers/coingecko/coingecko-handler";
import { startAlertPriceJob, startTestAlertPriceJob } from "./jobs/alert-price.job";
import { startCoinListSyncJob } from "./jobs/coin-list-sync.job";
import { registerProcessShutdown, shutdown } from "./lifecycle/shutdown";
import { logger } from "./logger/logger";

const serverHandler = ServerHandler.getInstance();
const databaseHandler = DatabaseHandler.getInstance();
const botHandler = BotHandler.getInstance();
// const coinGeckoHandler = CoinGeckoHandler.getInstance();

const isProductionEnv = process.env.NODE_ENV === "production";
const alertJob = isProductionEnv ? startAlertPriceJob : startTestAlertPriceJob;

const main = async (): Promise<void> => {
  try {
    await serverHandler.start();
    await databaseHandler.connect();
    // await coinGeckoHandler.syncCoinList();
    await databaseHandler.deleteExpiredSearchSessions();
    await botHandler.start();
    await alertJob();
    await startCoinListSyncJob();
  } catch (error) {
    logger.error(`Unknown Error during the startup: ${(error as Error).message}`);
    await shutdown(1, "startup-error");
  }
};

registerProcessShutdown();

void main();
