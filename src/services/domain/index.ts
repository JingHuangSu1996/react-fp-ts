import * as F from "fp-ts/lib/function";
import * as T from "io-ts";
import { decodeWithCodec } from "../../utils/decode";
import * as Arr from "fp-ts/lib/Array";
import * as Rec from "fp-ts/lib/Record";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import { HttpClientEnv, getJson } from "services/http/HttpClient";
import { HttpJsonError } from "services/http/HttpError";
import { Breed } from "model/Breed";

type GetBreedsResponse = {
  message: Record<string, Array<string>>;
};

const getBreedsResponseCodec: T.Type<GetBreedsResponse> = T.type({
  message: T.record(T.string, T.array(T.string)),
});

export const getBreeds: RTE.ReaderTaskEither<
  HttpClientEnv,
  HttpJsonError,
  Array<Breed>
> = F.pipe(
  getJson(
    "https://dog.ceo/api/breeds/list/all",
    decodeWithCodec(getBreedsResponseCodec),
  ),
  RTE.map((response) =>
    F.pipe(
      Rec.toArray(response.message),
      Arr.map(([name, subBreeds]) => ({
        name,
        subBreeds,
      })),
    ),
  ),
);
