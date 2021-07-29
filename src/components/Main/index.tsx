import { AppEnvContext, useAppEnvRTE } from "hooks/useAppEnv";
import * as React from "react";
import * as RD from "@devexperts/remote-data-ts";
import * as Eq from "fp-ts/lib/Eq";
import { HttpJsonError } from "services/http/HttpError";
import { appEnv } from "../../appEnv";
import { Breed } from "model/Breed";
import { getBreeds } from "services/domain";
import { Breeds } from "components/Breeds";

const MainAppEnvRTE = () => {
  const [breedsRD, setBreedsRD] = React.useState<
    RD.RemoteData<HttpJsonError, Array<Breed>>
  >(RD.initial);

  useAppEnvRTE({
    rte: getBreeds,
    onBefore: () => setBreedsRD(RD.pending),
    onError: (error) => setBreedsRD(RD.failure(error)),
    onSuccess: (breeds) => setBreedsRD(RD.success(breeds)),
    deps: [],
    eqDeps: Eq.getTupleEq(),
  });

  return <Breeds breedsRD={breedsRD} />;
};

const Main = () => {
  return (
    <AppEnvContext.Provider value={appEnv}>
      <MainAppEnvRTE />
    </AppEnvContext.Provider>
  );
};

export default Main;
