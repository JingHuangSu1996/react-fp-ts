import {
  fetchHttpClient,
  HttpClient,
  HttpClientEnv,
} from "../src/services/http/HttpClient";
import {
  LocalStorage,
  LocalStorageEnv,
  domLocalStorage,
} from "./services/localStorage";
import {
  CacheService,
  CacheServiceEnv,
  makeLocalStorageCacheService,
} from "./services/cache";

const httpClient: HttpClient = fetchHttpClient;

export const httpClientEnv: HttpClientEnv = {
  httpClient,
};

const localStorage: LocalStorage = domLocalStorage;

export const localStorageEnv: LocalStorageEnv = {
  localStorage,
};

export const cacheService: CacheService = makeLocalStorageCacheService(
  localStorageEnv,
);

export const cacheServiceEnv: CacheServiceEnv = {
  cacheService,
};

export type AppEnv = HttpClientEnv & LocalStorageEnv & CacheServiceEnv;

export const appEnv: AppEnv = {
  ...httpClientEnv,
  ...localStorageEnv,
  ...cacheServiceEnv,
};
