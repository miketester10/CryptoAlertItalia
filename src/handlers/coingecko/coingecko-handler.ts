import { API, MAX_SEARCH_RESULTS } from "../../consts/api";
import { EXCLUDED_COIN_ID_VALUES } from "../../consts/coingecko";
import { CoinListItem } from "../../interfaces/coin-list-item.interface";
import { ApiHandler } from "../api/api-handler";
import {
  CoinGeckoSimplePriceResponse,
  coinGeckoCoinSchema,
  coinGeckoSimplePriceResponseSchema,
} from "../../schemas/coingecko-api.schema";
import { DatabaseHandler } from "../database/database-handler";
import { logger } from "../../logger/logger";

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
    const filteredResponse = await this.fetchFilteredCoinList();

    await this.databaseHandler.replaceCoinList(filteredResponse);
    logger.info(`✅ Coin list aggiornata con ${filteredResponse.length} asset`);

    return filteredResponse.length;
  }

  async searchCoinsBySymbol(symbol: string): Promise<CoinListItem[]> {
    const normalizedSymbol = symbol.toLowerCase();
    const resultsFromDatabase = await this.databaseHandler.findCoinsBySymbol(normalizedSymbol);

    if (resultsFromDatabase.length > 0) {
      return this.selectCoinMatches(
        resultsFromDatabase.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
        })),
        normalizedSymbol,
      );
    }

    logger.warn(
      `Coin non trovata nel database. Simbolo: [${symbol}]. Eseguo fallback live verso CoinGecko senza persistenza.`,
    );
    const liveCoinList = await this.fetchFilteredCoinList();

    return this.selectCoinMatches(liveCoinList, normalizedSymbol);
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
    const parsedResponse: CoinGeckoSimplePriceResponse =
      coinGeckoSimplePriceResponseSchema.parse(rawResponse);

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

  private async fetchFilteredCoinList(): Promise<CoinListItem[]> {
    const rawResponse = await this.apiHandler.get<unknown>(API.COINGECKO_COIN_LIST);

    if (!Array.isArray(rawResponse)) {
      throw new Error("La Coin list restituita da CoinGecko non è un array.");
    }

    const validCoins: CoinListItem[] = [];

    for (const coin of rawResponse) {
      const result = coinGeckoCoinSchema.safeParse(coin);
      if (result.success) {
        validCoins.push(result.data);
      }
    }

    if (validCoins.length !== rawResponse.length) {
      logger.warn(
        `Rimosse ${rawResponse.length - validCoins.length} coin non valide dalla Coin list di CoinGecko.`,
      );
    }

    return validCoins.filter((coin) => !this.hasExcludedCoinIdValue(coin.id));
  }

  private selectCoinMatches(coinList: readonly CoinListItem[], symbol: string): CoinListItem[] {
    return coinList
      .filter((coin) => coin.symbol === symbol)
      .sort(
        (firstCoin, secondCoin) =>
          firstCoin.name.localeCompare(secondCoin.name) ||
          firstCoin.id.localeCompare(secondCoin.id),
      )
      .slice(0, MAX_SEARCH_RESULTS);
  }

  private hasExcludedCoinIdValue(coinId: string): boolean {
    const normalizedCoinId = coinId.toLowerCase();

    return EXCLUDED_COIN_ID_VALUES.some((excludedValue) =>
      normalizedCoinId.includes(excludedValue),
    );
  }
}
