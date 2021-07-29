import * as React from "react";
import { appEnv, AppEnv } from "../appEnv";
import * as RT from "fp-ts/lib/ReaderTask";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as Eq from "fp-ts/lib/Eq";
import * as F from "fp-ts/lib/function";
import { useIO } from "./useIO";

export const AppEnvContext = React.createContext(appEnv);

export const useAppEnv = () => {
  return React.useContext(AppEnvContext);
};

export const useAppEnvRT = <Deps extends Array<unknown>>({
  rt,
  deps,
  eqDeps,
}: {
  rt: RT.ReaderTask<AppEnv, void>;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}) => {
  const env = useAppEnv();

  useIO(
    () => {
      RT.run(rt, env);
    },
    deps,
    eqDeps,
  );
};

export const useAppEnvRTE = <E, A, Deps extends Array<unknown>>({
  rte,
  onBefore,
  onError,
  onSuccess,
  deps,
  eqDeps,
}: {
  rte: RTE.ReaderTaskEither<AppEnv, E, A>;
  onBefore: () => void;
  onError: (e: E) => void;
  onSuccess: (a: A) => void;
  deps: Deps;
  eqDeps: Eq.Eq<Deps>;
}): void => {
  const rt: RT.ReaderTask<AppEnv, void> = F.pipe(
    RTE.fromIO<any, any, any>(onBefore),
    RTE.chain((_) => rte),
    RTE.fold<AppEnv, E, A, void>(
      (e) => RT.fromIO(() => onError(e)),
      (a) => RT.fromIO(() => onSuccess(a)),
    ),
  );

  useAppEnvRT({
    rt,
    deps,
    eqDeps,
  });
};
