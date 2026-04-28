import { Alert, Coin, Prisma, PrismaClient, SearchSession, User } from "@prisma/client";
import { logger } from "../../logger/logger";
import { CreateUserDto } from "../../dto/create-user.dto";
import { UpdateUserDto } from "../../dto/update-user.dto";
import { CreateAlertDto } from "../../dto/create-alert.dto";
import { UpdateAlertDto } from "../../dto/update-alert.dto";
import { CreateSearchSessionDto } from "../../dto/create-search-session.dto";
import { CoinGeckoCoinListItemResponse } from "../../schemas/coingecko-api.schema";

export class DatabaseHandler {
  private static _instance: DatabaseHandler;
  readonly prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): DatabaseHandler {
    if (!DatabaseHandler._instance) {
      DatabaseHandler._instance = new DatabaseHandler();
    }

    return DatabaseHandler._instance;
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    logger.info("✅ Database MongoDB connesso con successo");
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info("✅ Database MongoDB disconnesso");
  }

  async createUser(createUserDto: CreateUserDto): Promise<void> {
    const { telegramId, name, username } = createUserDto;

    await this.prisma.user.create({
      data: {
        telegramId,
        name,
        username: username ?? null,
      },
    });
  }

  async updateUser(telegramId: number, user: User, updateUserDto: UpdateUserDto): Promise<boolean> {
    const { name, username } = updateUserDto;
    const normalizedUsername = username === undefined ? null : username;
    const isDataChanged = user.name !== name || user.username !== normalizedUsername;

    if (!isDataChanged) {
      return false;
    }

    await this.prisma.user.update({
      where: { telegramId },
      data: {
        name,
        username: normalizedUsername,
      },
    });

    return true;
  }

  async findUserByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async createAlert(createAlertDto: CreateAlertDto): Promise<void> {
    await this.prisma.alert.create({
      data: createAlertDto,
    });
  }

  async findAlert(userTelegramId: number, coinId: string, alertPrice: number): Promise<Alert | null> {
    return this.prisma.alert.findFirst({
      where: { userTelegramId, coinId, alertPrice },
    });
  }

  async findAlertById(alertId: string): Promise<Alert | null> {
    return this.prisma.alert.findUnique({
      where: { id: alertId },
    });
  }

  async findAllAlerts(): Promise<Alert[]> {
    return this.prisma.alert.findMany();
  }

  async findAllAlertsByTelegramId(userTelegramId: number): Promise<Alert[]> {
    return this.prisma.alert.findMany({
      where: { userTelegramId },
    });
  }

  async updateAlert(updateAlertDto: UpdateAlertDto): Promise<void> {
    const { id, ...rest } = updateAlertDto;

    await this.prisma.alert.update({
      where: { id },
      data: rest,
    });
  }

  async deleteAlertById(alertId: string): Promise<void> {
    await this.prisma.alert.delete({
      where: { id: alertId },
    });
  }

  async deleteAllAlertsByTelegramId(userTelegramId: number): Promise<void> {
    await this.prisma.alert.deleteMany({
      where: { userTelegramId },
    });
  }

  async replaceCoinList(coins: readonly CoinGeckoCoinListItemResponse[]): Promise<void> {
    await this.prisma.coin.deleteMany();
    const data: Prisma.CoinCreateManyInput[] = coins.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
    }));

    await this.prisma.coin.createMany({ data });
  }

  async countCoins(): Promise<number> {
    return this.prisma.coin.count();
  }

  async findCoinsBySymbol(symbol: string): Promise<Coin[]> {
    return this.prisma.coin.findMany({
      where: { symbol },
    });
  }

  async createSearchSession(createSearchSessionDto: CreateSearchSessionDto): Promise<SearchSession> {
    const { userTelegramId, action, querySymbol, alertPrice, results, expiresAt } = createSearchSessionDto;

    return this.prisma.searchSession.create({
      data: {
        userTelegramId,
        action,
        querySymbol,
        alertPrice,
        results,
        expiresAt,
      },
    });
  }

  async findSearchSessionById(sessionId: string): Promise<SearchSession | null> {
    return this.prisma.searchSession.findUnique({
      where: { id: sessionId },
    });
  }

  async deleteSearchSessionById(sessionId: string): Promise<void> {
    await this.prisma.searchSession.delete({
      where: { id: sessionId },
    });
  }

  async deleteExpiredSearchSessions(referenceDate: Date = new Date()): Promise<void> {
    await this.prisma.searchSession.deleteMany({
      where: {
        expiresAt: {
          lte: referenceDate,
        },
      },
    });
  }
}
