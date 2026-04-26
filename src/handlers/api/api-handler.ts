import axios, { RawAxiosRequestHeaders } from "axios";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

const httpAgent = new HttpAgent({
  keepAlive: true,
  keepAliveMsecs: 20 * 1000,
});

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 20 * 1000,
});

const httpClient = axios.create({
  timeout: 10 * 1000,
  httpAgent,
  httpsAgent,
});

export class ApiHandler {
  private static _instance: ApiHandler;
  private readonly coinGeckoApiKey: string | undefined = process.env.COINGECKO_API_KEY;

  private constructor() {}

  static getInstance(): ApiHandler {
    if (!ApiHandler._instance) {
      ApiHandler._instance = new ApiHandler();
    }

    return ApiHandler._instance;
  }

  async get<T>(api: string): Promise<T> {
    const headers: RawAxiosRequestHeaders = this.coinGeckoApiKey ? { "x-cg-demo-api-key": this.coinGeckoApiKey } : {};
    const response = await httpClient.get<T>(api, { headers });
    return response.data;
  }
}
