import { CronJob } from "cron";
import { CoinGeckoHandler } from "../handlers/coingecko/coingecko-handler";
import { DatabaseHandler } from "../handlers/database/database-handler";
import { logger } from "../logger/logger";

const coinGeckoHandler = CoinGeckoHandler.getInstance();
const databaseHandler = DatabaseHandler.getInstance();
let activeJob: CronJob | null = null;

export const startCoinListSyncJob = async (): Promise<void> => {
  const job = new CronJob(
    "0 */6 * * *",
    async () => {
      try {
        await coinGeckoHandler.syncCoinList();
        await databaseHandler.deleteExpiredSearchSessions();
        logger.info("CoinListSyncJob completato con successo");
      } catch (error) {
        logger.error(`Errore nel CoinListSyncJob: ${(error as Error).message}`);
      }
    },
    null,
    true,
    "Europe/Rome",
  );

  job.start();
  activeJob = job;
  logger.info("✅ CoinListSyncJob attivo: ogni 6 ore.");
};

export const stopCoinListSyncJob = (): void => {
  if (!activeJob) {
    return;
  }

  activeJob.stop();
  activeJob = null;
  logger.info("✅ CoinListSyncJob fermato");
};
