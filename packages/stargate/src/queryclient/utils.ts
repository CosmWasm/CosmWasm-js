import { fromAscii, fromBech32 } from "@cosmjs/encoding";
import { Decimal, Uint53, Uint64 } from "@cosmjs/math";
import { PageRequest } from "cosmjs-types/cosmos/base/query/v1beta1/pagination";

import { QueryClient } from "./queryclient";

/**
 * Takes a bech32 encoded address and returns the data part. The prefix is ignored and discarded.
 * This is called AccAddress in Cosmos SDK, which is basically an alias for raw binary data.
 * The result is typically 20 bytes long but not restricted to that.
 */
export function toAccAddress(address: string): Uint8Array {
  return fromBech32(address).data;
}

/**
 * If paginationKey is set, return a `PageRequest` with the given key.
 * If paginationKey is unset, return `undefined`.
 *
 * Use this with a query response's pagination next key to
 * request the next page.
 */
export function createPagination(paginationKey?: Uint8Array): PageRequest {
  return paginationKey ? PageRequest.fromPartial({ key: paginationKey }) : PageRequest.fromPartial({});
}

/**
 * This interface is more or less a copy of
 * https://github.com/confio/cosmjs-types/blob/v0.6.1/src/helpers.ts#L180-L182.
 *
 * It needs to be compatible to the `Rpc` client expected by the query services
 * auto-generated in cosmjs-types.
 */
export interface ProtobufRpcClient {
  // See https://github.com/grpc/grpc-go/blob/master/Documentation/grpc-metadata.md.
  // To keep things simple, we only support one items per key here.
  setMetadata(md: Map<string, string>): void;
  // A version of setMetadata that clears all elements
  clearMetadata(): void;
  // Returns a copy of the current metadata
  getMetadata(): Map<string, string>;
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

export function createProtobufRpcClient(base: QueryClient): ProtobufRpcClient {
  const metadata = new Map<string, string>();
  return {
    setMetadata: (md: Map<string, string>) => {
      // Override metadata without changing the reference
      metadata.clear();
      for (const [k, v] of md.entries()) {
        metadata.set(k, v);
      }
    },
    clearMetadata: () => {
      metadata.clear();
    },
    getMetadata: (): Map<string, string> => {
      const copies = Array.from(metadata.entries());
      return new Map(copies);
    },
    request: async (service: string, method: string, data: Uint8Array): Promise<Uint8Array> => {
      const cosmosBlockHeight = metadata.get("x-cosmos-block-height");
      const queryHeight = cosmosBlockHeight ? Uint53.fromString(cosmosBlockHeight).toNumber() : undefined;
      const path = `/${service}/${method}`;
      const response = await base.queryAbci(path, data, queryHeight);
      return response.value;
    },
  };
}

/**
 * Takes a uint64 value as string, number, BigInt or Uint64 and returns a BigInt
 * of it.
 */
export function longify(value: string | number | Uint64): bigint {
  const checkedValue = Uint64.fromString(value.toString());
  return BigInt(checkedValue.toString());
}

/**
 * Takes a string or binary encoded `github.com/cosmos/cosmos-sdk/types.Dec` from the
 * protobuf API and converts it into a `Decimal` with 18 fractional digits.
 *
 * See https://github.com/cosmos/cosmos-sdk/issues/10863 for more context why this is needed.
 */
export function decodeCosmosSdkDecFromProto(input: string | Uint8Array): Decimal {
  const asString = typeof input === "string" ? input : fromAscii(input);
  return Decimal.fromAtomics(asString, 18);
}
