import * as T from "io-ts";
import { DecodeError } from "../../utils/decode";
import * as F from "fp-ts/lib/function";
import * as R from "fp-ts/lib/Reader";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { getItemWithCache, LocalStorageEnv } from "../localStorage";

/**
 * ==============
 *   Interface
 * ==============
 */

export interface CacheService {
  getWithCache<RGet, EGet, A>(
    key: string,
    codec: T.Type<A>,
    get: RTE.ReaderTaskEither<RGet, EGet, A>,
  ): RTE.ReaderTaskEither<RGet, EGet | DecodeError, A>;

  clear: TE.TaskEither<never, void>;
}

export interface CacheServiceEnv {
  cacheService: CacheService;
}

/**
 * ============================
 *   RTE and helper fucntion
 * ============================
 */

export const getWithCache = <RGet, EGet, A>(
  key: string,
  codec: T.Type<A>,
  get: RTE.ReaderTaskEither<RGet, EGet, A>,
): RTE.ReaderTaskEither<CacheServiceEnv & RGet, EGet | DecodeError, A> =>
  F.pipe(
    RTE.ask<CacheServiceEnv>(),
    RTE.chainW((env) => env.cacheService.getWithCache(key, codec, get)),
  );

export const clear: RTE.ReaderTaskEither<CacheServiceEnv, never, void> = F.pipe(
  RTE.ask<CacheServiceEnv>(),
  RTE.chainTaskEitherKW((env) => env.cacheService.clear),
);

/**
 * ==============
 * Implementation
 * ==============
 */

export const makeLocalStorageCacheService: R.Reader<
  LocalStorageEnv,
  CacheService
> = (localStorageEnv): CacheService => ({
  getWithCache: <RGet, EGet, A>(
    key: string,
    codec: T.Type<A>,
    get: RTE.ReaderTaskEither<RGet, EGet, A>,
  ) =>
    F.pipe(
      RTE.ask<RGet>(),
      RTE.chainTaskEitherKW((r) =>
        getItemWithCache(key, codec, get)({ ...localStorageEnv, ...r }),
      ),
    ),

  clear: TE.fromIO(localStorageEnv.localStorage.clear),
});
