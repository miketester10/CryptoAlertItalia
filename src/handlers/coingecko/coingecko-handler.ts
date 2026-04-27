import { Coin } from "@prisma/client";
import { API, MAX_SEARCH_RESULTS } from "../../consts/api";
import { ApiHandler } from "../api/api-handler";
import {
  CoinGeckoSimplePriceResponse,
  coinGeckoCoinListResponseSchema,
  coinGeckoSimplePriceResponseSchema,
} from "../../schemas/coingecko-api.schema";
import { DatabaseHandler } from "../database/database-handler";
import { logger } from "../../logger/logger";

const EXCLUDED_COIN_ID_VALUES = [
  "-peg-",
  "-wormhole",
  "wrapped",
  "oec-",
  "-iou",
  "harrypotter",
  "blackrocktradingcurrency",
] as const;

export class CoinGeckoHandler {
  private static _instance: CoinGeckoHandler;
  private readonly apiHandler: ApiHandler = ApiHandler.getInstance();
  private readonly databaseHandler: DatabaseHandler = DatabaseHandler.getInstance();

  private constructor() {}

  static getInstance(): CoinGeckoHandler {
    if (!CoinGeckoHandler._instance) {
      CoinGeckoHandler._instance = new CoinGeckoHandler();
    }

    return CoinGeckoHandler._instance;
  }

  async syncCoinList(): Promise<number> {
    const rawResponse = await this.apiHandler.get<unknown>(API.COINGECKO_COIN_LIST);
    const parsedResponse = coinGeckoCoinListResponseSchema.parse(rawResponse);
    const filteredResponse = parsedResponse.filter((coin) => !this.hasExcludedCoinIdValue(coin.id));

    await this.databaseHandler.replaceCoinList(filteredResponse);
    logger.info(`✅ Coin list aggiornata con ${filteredResponse.length} asset`);

    return filteredResponse.length;
  }

  async ensureCoinList(): Promise<void> {
    const coinsCount = await this.databaseHandler.countCoins();

    if (coinsCount === 0) {
      await this.syncCoinList();
    }
  }

  async searchCoinsBySymbol(symbol: string): Promise<Coin[]> {
    await this.ensureCoinList();

    let results = await this.databaseHandler.findCoinsBySymbol(symbol.toLowerCase(), MAX_SEARCH_RESULTS);

    if (results.length === 0) {
      logger.warn(`Coin non trovata. Simbolo: [${symbol}]. Aggiorno Coin List da CoinGecko.`);
      await this.syncCoinList();
      results = await this.databaseHandler.findCoinsBySymbol(symbol.toLowerCase(), MAX_SEARCH_RESULTS);
    }

    return results;
  }

  async getCurrentPrice(coinId: string): Promise<number | null> {
    const pricesMap = await this.getCurrentPrices([coinId]);
    return pricesMap.get(coinId) ?? null;
  }

  async getCurrentPrices(coinIds: readonly string[]): Promise<Map<string, number>> {
    const uniqueCoinIds = [...new Set(coinIds)];
    const priceMap = new Map<string, number>();

    if (uniqueCoinIds.length === 0) {
      return priceMap;
    }

    const rawResponse = await this.apiHandler.get<unknown>(this.buildSimplePriceUrl(uniqueCoinIds));
    const parsedResponse: CoinGeckoSimplePriceResponse = coinGeckoSimplePriceResponseSchema.parse(rawResponse);

    Object.entries(parsedResponse).forEach(([coinId, value]) => {
      priceMap.set(coinId, value.usd);
    });

    return priceMap;
  }

  private buildSimplePriceUrl(coinIds: readonly string[]): string {
    const queryParams = new URLSearchParams({
      vs_currencies: API.USD_CURRENCY,
      ids: coinIds.join(","),
    });

    return `${API.COINGECKO_SIMPLE_PRICE}?${queryParams.toString()}`;
  }

  private hasExcludedCoinIdValue(coinId: string): boolean {
    const normalizedCoinId = coinId.toLowerCase();

    return EXCLUDED_COIN_ID_VALUES.some((excludedValue) => normalizedCoinId.includes(excludedValue));
  }
}
