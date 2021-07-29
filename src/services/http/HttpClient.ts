import * as E from "fp-ts/lib/Either";
import * as F from "fp-ts/lib/function";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { DecodeError } from "../../utils/decode";
import {
  HttpContentTypeError,
  HttpJsonError,
  HttpRequestError,
  HttpResponseStatusError,
  httpContentTypeError,
  httpRequestError,
  httpResponseStatusError,
} from "./HttpError";

/**
 * ==============
 *   Interface
 * ==============
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface HttpRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  headers?: Record<string, string>;
  getBodyAsJson: TE.TaskEither<HttpContentTypeError<"json">, unknown>;
  getBodyAsText: TE.TaskEither<HttpContentTypeError<"text">, string>;
}

export interface HttpClient {
  sendRequest(
    request: HttpRequest,
  ): TE.TaskEither<HttpRequestError, HttpResponse>;
}

export interface HttpClientEnv {
  httpClient: HttpClient;
}

/**
 * ==============
 * Implementation
 * ==============
 */

export const httpRequestToFetchRequest = (request: HttpRequest): Request =>
  new Request(request.url, { ...request });

export const fetchResponseToHttpResponse = (
  response: Response,
): HttpResponse => ({
  status: response.status,
  headers: {},
  getBodyAsJson: TE.tryCatch(
    () => response.clone().json(),
    (e) => httpContentTypeError<"json">("json", e),
  ),
  getBodyAsText: TE.tryCatch(
    () => response.clone().json(),
    (e) => httpContentTypeError<"text">("text", e),
  ),
});

export const fetchHttpClient: HttpClient = {
  sendRequest: F.pipe(
    RTE.ask<HttpRequest>(),
    RTE.chainTaskEitherK((request) =>
      TE.tryCatch(
        () => fetch(httpRequestToFetchRequest(request)),
        httpRequestError,
      ),
    ),
    RTE.map(fetchResponseToHttpResponse),
  ),
};

/**
 * ============================
 *   RTE and helper fucntion
 * ============================
 */

export const sendRequest = (
  httpRequest: HttpRequest,
): RTE.ReaderTaskEither<HttpClientEnv, HttpRequestError, HttpResponse> =>
  F.pipe(
    RTE.asks((m: HttpClientEnv) => m.httpClient),
    RTE.chainTaskEitherKW((httpClient) => httpClient.sendRequest(httpRequest)),
  );

export const ensureStatusRange = (
  minInclusive: number,
  maxExclusive: number,
) => (
  httpResponse: HttpResponse,
): E.Either<HttpResponseStatusError, HttpResponse> =>
  httpResponse.status >= minInclusive && httpResponse.status < maxExclusive
    ? E.right(httpResponse)
    : E.left(
        httpResponseStatusError(
          httpResponse,
          httpResponse.status,
          minInclusive,
          maxExclusive,
        ),
      );

export const ensureOk = ensureStatusRange(200, 300);

export const getJson = <A>(
  url: string,
  decode: (raw: unknown) => E.Either<DecodeError, A>,
): RTE.ReaderTaskEither<HttpClientEnv, HttpJsonError, A> =>
  F.pipe(
    sendRequest({ method: "GET", url }),
    RTE.chainEitherKW(ensureOk),
    RTE.chainTaskEitherKW((response) => response.getBodyAsJson),
    RTE.chainEitherKW(decode),
  );
