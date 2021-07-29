import * as React from "react";
import * as Eq from "fp-ts/lib/Eq";
import * as IO from "fp-ts/lib/IO";
import { useStable } from "./useStable";

export const useIO = <T extends Array<unknown>>(
  io: IO.IO<void>,
  dependencies: T,
  eq: Eq.Eq<T>,
) => {
  const deps = useStable(dependencies, eq);

  React.useEffect(() => {
    io();
  }, deps);
};
