import * as T from "io-ts";

import * as E from "fp-ts/lib/Either";
import * as F from "fp-ts/lib/function";

export type DecodeError = { tag: "decodeError"; errors: T.Errors };

export const decodeError = (errors: T.Errors): DecodeError => ({
  tag: "decodeError",
  errors,
});

export const decodeWithCodec = <A>(codec: T.Type<A>) => (
  value: unknown,
): E.Either<DecodeError, A> =>
  F.pipe(codec.decode(value), E.mapLeft(decodeError));
