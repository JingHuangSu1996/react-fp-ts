import * as React from "react";
import * as Eq from "fp-ts/lib/Eq";

export const useStable = <A>(a: A, eqA: Eq.Eq<A>) => {
  const refA = React.useRef<A>(a);

  if (!eqA.equals(a, refA.current)) {
    refA.current = a;
  }

  return refA.current;
};
