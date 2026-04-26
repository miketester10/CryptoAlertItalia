import { DatabaseHandler } from "../database/database-handler";
import { logger } from "../../logger/logger";
import { MyUserSourceContext } from "../../types/custom-context.type";

const databaseHandler = DatabaseHandler.getInstance();

export const userHandler = async (ctx: MyUserSourceContext): Promise<void> => {
  if (!ctx.from) {
    return;
  }

  const telegramId = ctx.from.id;
  const name = ctx.from.firstName;
  const username = ctx.from.username ?? null;

  const user = await databaseHandler.findUserByTelegramId(telegramId);

  if (user) {
    const isUpdated = await databaseHandler.updateUser(telegramId, user, { name, username });
    logger.debug(`Utente [${name}] gia registrato. ${isUpdated ? "Dati aggiornati con successo." : "Nessun aggiornamento necessario."}`);
    return;
  }

  await databaseHandler.createUser({ telegramId, name, username });
  logger.info(`Nuovo utente [${name}] registrato con successo.`);
};
