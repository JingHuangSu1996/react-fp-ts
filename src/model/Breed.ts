import * as T from "io-ts";

export interface Breed {
  name: string;
  subBreeds: Array<string>;
}

export const breedCodec: T.Type<Breed> = T.type({
  name: T.string,
  subBreeds: T.array(T.string),
});
