import { CronJob } from "cron";
import { AlertHandler } from "../handlers/alert/alert-handler";
import { logger } from "../logger/logger";

const alertHandler = AlertHandler.getInstance();
const productionMinutes = 2;
const testMinutes = 1;
let activeJob: CronJob | null = null;

export const startAlertPriceJob = async (): Promise<void> => {
  const job = new CronJob(
    `*/${productionMinutes} * * * *`,
    async () => {
      try {
        await alertHandler.checkAndNotifyAlerts();
        const date = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" });
        logger.info(`AlertPriceJob eseguito il: ${date}`);
      } catch (error) {
        logger.error(`Errore nell'esecuzione dell'AlertPriceJob: ${(error as Error).message}`);
      }
    },
    null,
    true,
    "Europe/Rome",
  );

  job.start();
  activeJob = job;
  logger.info(`✅ AlertPriceJob attivo: ogni ${productionMinutes} minuti.`);
};

export const startTestAlertPriceJob = async (): Promise<void> => {
  const job = new CronJob(
    `*/${testMinutes} * * * *`,
    async () => {
      try {
        await alertHandler.checkAndNotifyAlerts();
        const date = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" });
        logger.info(`TestAlertPriceJob eseguito il: ${date}`);
      } catch (error) {
        logger.error(`Errore nell'esecuzione del TestAlertPriceJob: ${(error as Error).message}`);
      }
    },
    null,
    true,
    "Europe/Rome",
  );

  job.start();
  activeJob = job;
  logger.info(`✅ TestAlertPriceJob attivo: ogni ${testMinutes} minuto.`);
};

export const stopAlertPriceJob = (): void => {
  if (!activeJob) {
    return;
  }

  activeJob.stop();
  activeJob = null;
  logger.info("✅ AlertPriceJob fermato");
};
