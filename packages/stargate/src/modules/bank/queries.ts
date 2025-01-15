/* eslint-disable @typescript-eslint/naming-convention */
import { assert } from "@cosmjs/utils";
import { Metadata } from "cosmjs-types/cosmos/bank/v1beta1/bank";
import {
  QueryAllBalancesRequest,
  QueryAllBalancesResponse,
  QueryClientImpl,
  QueryDenomsMetadataRequest,
  QueryTotalSupplyResponse,
} from "cosmjs-types/cosmos/bank/v1beta1/query";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";

import { createPagination, createProtobufRpcClient, QueryClient } from "../../queryclient";

export interface BankExtension {
  readonly bank: {
    readonly balance: (address: string, denom: string) => Promise<Coin>;
    readonly allBalances: (address: string) => Promise<Coin[]>;
    readonly totalSupply: (paginationKey?: Uint8Array) => Promise<QueryTotalSupplyResponse>;
    readonly supplyOf: (denom: string) => Promise<Coin>;
    readonly denomMetadata: (denom: string) => Promise<Metadata>;
    readonly denomsMetadata: () => Promise<Metadata[]>;
  };
}

export function setupBankExtension(base: QueryClient): BankExtension {
  const rpc = createProtobufRpcClient(base);
  // Use this service to get easy typed access to query methods
  // This cannot be used for proof verification
  const queryService = new QueryClientImpl(rpc);

  return {
    bank: {
      balance: async (address: string, denom: string) => {
        const { balance } = await queryService.Balance({ address: address, denom: denom });
        assert(balance);
        return balance;
      },
      allBalances: async (address: string) => {
        const allBalances = [];
        let paginationKey: Uint8Array | undefined = undefined;
        do {
          const { balances, pagination }: QueryAllBalancesResponse = await queryService.AllBalances(
            QueryAllBalancesRequest.fromPartial({
              address: address,
              pagination: createPagination(paginationKey),
            }),
          );

          const loadedBalances = balances || [];
          allBalances.push(...loadedBalances);
          paginationKey = pagination?.nextKey;
        } while (paginationKey !== undefined && paginationKey.length !== 0);

        return allBalances;
      },
      totalSupply: async (paginationKey?: Uint8Array) => {
        const response = await queryService.TotalSupply({
          pagination: createPagination(paginationKey),
        });
        return response;
      },
      supplyOf: async (denom: string) => {
        const { amount } = await queryService.SupplyOf({ denom: denom });
        assert(amount);
        return amount;
      },
      denomMetadata: async (denom: string) => {
        const { metadata } = await queryService.DenomMetadata({ denom });
        assert(metadata);
        return metadata;
      },
      denomsMetadata: async () => {
        const { metadatas } = await queryService.DenomsMetadata(
          QueryDenomsMetadataRequest.fromPartial({
            pagination: undefined, // Not implemented
          }),
        );
        return metadatas;
      },
    },
  };
}
