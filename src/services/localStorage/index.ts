import * as T from "io-ts";
import * as E from "fp-ts/lib/Either";
import * as F from "fp-ts/lib/function";
import * as IO from "fp-ts/lib/IO";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as O from "fp-ts/lib/Option";
import { decodeWithCodec, DecodeError } from "../../utils/decode";

/**
 * ==============
 *   Interface
 * ==============
 */

export interface LocalStorage {
  getItem(key: string): IO.IO<O.Option<string>>;
  setItem(key: string, value: string): IO.IO<void>;
  removeItem(key: string): IO.IO<void>;
  clear: IO.IO<void>;
  size: IO.IO<number>;
}

export interface LocalStorageEnv {
  localStorage: LocalStorage;
}

/**
 * ==============
 * Implementation
 * ==============
 */

export const domLocalStorage: LocalStorage = {
  getItem: (key: string) => () => O.fromNullable(localStorage.getItem(key)),
  setItem: (key: string, value: string) => () =>
    localStorage.setItem(key, value),
  removeItem: (key: string) => () => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
  size: () => localStorage.size(),
};

/**
 * ============================
 *   RTE and helper fucntion
 * ============================
 */
export const getItem = (
  key: string,
): RTE.ReaderTaskEither<LocalStorageEnv, never, O.Option<string>> =>
  F.pipe(
    RTE.ask<LocalStorageEnv>(),
    RTE.chain((env) => RTE.fromIO(env.localStorage.getItem(key))),
  );

export const setItem = (
  key: string,
  value: string,
): RTE.ReaderTaskEither<LocalStorageEnv, never, void> =>
  F.pipe(
    RTE.ask<LocalStorageEnv>(),
    RTE.chain((env) => RTE.fromIO(env.localStorage.setItem(key, value))),
  );

export const removeItem = (
  key: string,
): RTE.ReaderTaskEither<LocalStorageEnv, never, void> =>
  F.pipe(
    RTE.ask<LocalStorageEnv>(),
    RTE.chain((env) => RTE.fromIO(env.localStorage.removeItem(key))),
  );

export const clear: RTE.ReaderTaskEither<LocalStorageEnv, never, void> = F.pipe(
  RTE.ask<LocalStorageEnv>(),
  RTE.chain((env) => RTE.fromIO(env.localStorage.clear)),
);

export const size: RTE.ReaderTaskEither<
  LocalStorageEnv,
  never,
  number
> = F.pipe(
  RTE.ask<LocalStorageEnv>(),
  RTE.chain((env) => RTE.fromIO(env.localStorage.size)),
);

export const getItemWithDecode = <E, A>(
  key: string,
  decode: (raw: unknown) => E.Either<E, A>,
): RTE.ReaderTaskEither<LocalStorageEnv, E, O.Option<A>> =>
  F.pipe(
    getItem(key),
    RTE.chainEitherKW(
      F.flow(
        O.fold(
          (): E.Either<E, O.Option<A>> => E.right(O.none),
          F.flow(JSON.parse, decode, E.map(O.some)),
        ),
      ),
    ),
  );

export const setItemWithEncode = <A>(
  key: string,
  item: A,
  encode: (a: A) => unknown,
): RTE.ReaderTaskEither<LocalStorageEnv, never, void> =>
  F.pipe(item, encode, JSON.stringify, (value) => setItem(key, value));

export const getItemWithCache = <RGet, EGet, A>(
  key: string,
  codec: T.Type<A>,
  get: RTE.ReaderTaskEither<RGet, EGet, A>,
): RTE.ReaderTaskEither<LocalStorageEnv & RGet, EGet | DecodeError, A> =>
  F.pipe(
    getItemWithDecode(key, decodeWithCodec(codec)),
    RTE.chainW(
      F.flow(
        O.fold(
          () =>
            // Cache miss - do the API call, and store the results in the cache
            F.pipe(
              // Do get call
              get,
              RTE.chainW((data) =>
                F.pipe(
                  // Store the results as a side-effect
                  setItemWithEncode(key, data, codec.encode),
                  // Return the results
                  RTE.map((_) => data),
                ),
              ),
            ),
          (res: A) => RTE.right(res),
        ),
      ),
    ),
  );
