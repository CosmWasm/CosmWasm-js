/* eslint-disable @typescript-eslint/naming-convention */
import { coin } from "@cosmjs/amino";
import { toAscii } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";
import { assert } from "@cosmjs/utils";
import { Metadata } from "cosmjs-types/cosmos/bank/v1beta1/bank";
import {
  QueryAllBalancesRequest,
  QueryAllBalancesResponse,
  QueryBalanceRequest,
  QueryBalanceResponse,
} from "cosmjs-types/cosmos/bank/v1beta1/query";

import { SigningStargateClient } from "../signingstargateclient";
import {
  defaultSigningClientOptions,
  faucet,
  makeRandomAddress,
  pendingWithoutSimapp,
  simapp,
  simapp44Enabled,
  unused,
} from "../testutils.spec";
import { QueryClient } from "./queryclient";

async function makeClient(rpcUrl: string): Promise<[QueryClient, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient), cometClient];
}

/**
 * See
 * - https://github.com/cosmos/cosmos-sdk/blob/v0.42.10/x/bank/types/key.go#L27
 * - https://github.com/cosmos/cosmos-sdk/blob/v0.44.2/x/bank/types/key.go#L28
 */
const denomMetadataPrefix = new Uint8Array([0x01]);

describe("QueryClient", () => {
  describe("queryStoreVerified", () => {
    it("works via WebSockets", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClient(simapp.tendermintUrlWs);

      // "keys before 0.45 had denom two times in the key"
      // https://github.com/cosmos/cosmos-sdk/blob/10ad61a4dd/x/bank/migrations/v045/store_test.go#L91
      let queryKey: Uint8Array;
      if (simapp44Enabled()) {
        queryKey = Uint8Array.from([
          ...denomMetadataPrefix,
          ...toAscii(simapp.denomFee),
          ...toAscii(simapp.denomFee),
        ]);
      } else {
        queryKey = Uint8Array.from([...denomMetadataPrefix, ...toAscii(simapp.denomFee)]);
      }
      const { key, value, height } = await client.queryStoreVerified("bank", queryKey);
      expect(height).toBeGreaterThanOrEqual(1);
      expect(key).toEqual(queryKey);
      const response = Metadata.decode(value);
      expect(response.base).toEqual(simapp.denomFee);
      expect(response.description).toEqual("The fee token of this test chain");

      cometClient.disconnect();
    });

    it("works via http", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClient(simapp.tendermintUrlHttp);

      // "keys before 0.45 had denom two times in the key"
      // https://github.com/cosmos/cosmos-sdk/blob/10ad61a4dd/x/bank/migrations/v045/store_test.go#L91
      let queryKey: Uint8Array;
      if (simapp44Enabled()) {
        queryKey = Uint8Array.from([
          ...denomMetadataPrefix,
          ...toAscii(simapp.denomFee),
          ...toAscii(simapp.denomFee),
        ]);
      } else {
        queryKey = Uint8Array.from([...denomMetadataPrefix, ...toAscii(simapp.denomFee)]);
      }

      const { key, value, height } = await client.queryStoreVerified("bank", queryKey);
      expect(height).toBeGreaterThanOrEqual(1);
      expect(key).toEqual(queryKey);
      const response = Metadata.decode(value);
      expect(response.base).toEqual(simapp.denomFee);
      expect(response.description).toEqual("The fee token of this test chain");

      cometClient.disconnect();
    });
  });

  describe("queryAbci", () => {
    it("works via WebSockets", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClient(simapp.tendermintUrlWs);

      const requestData = Uint8Array.from(
        QueryAllBalancesRequest.encode(
          QueryAllBalancesRequest.fromPartial({ address: unused.address }),
        ).finish(),
      );
      const { value } = await client.queryAbci(`/cosmos.bank.v1beta1.Query/AllBalances`, requestData);
      const response = QueryAllBalancesResponse.decode(value);
      expect(response.balances.length).toEqual(2);

      cometClient.disconnect();
    });

    it("works via http", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClient(simapp.tendermintUrlHttp);

      const requestData = Uint8Array.from(
        QueryAllBalancesRequest.encode(
          QueryAllBalancesRequest.fromPartial({ address: unused.address }),
        ).finish(),
      );
      const { value } = await client.queryAbci(`/cosmos.bank.v1beta1.Query/AllBalances`, requestData);
      const response = QueryAllBalancesResponse.decode(value);
      expect(response.balances.length).toEqual(2);

      cometClient.disconnect();
    });

    it("works for height", async () => {
      pendingWithoutSimapp();
      const [queryClient, cometClient] = await makeClient(simapp.tendermintUrlHttp);

      const joe = makeRandomAddress();
      const h1 = (await cometClient.status()).syncInfo.latestBlockHeight;

      // Send tokens to `recipient`
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrlHttp,
        wallet,
        defaultSigningClientOptions,
      );
      const amount = coin(332211, simapp.denomFee);
      await client.sendTokens(faucet.address0, joe, [amount], "auto");

      const h2 = (await cometClient.status()).syncInfo.latestBlockHeight;
      assert(h1 < h2);

      // Query with no height
      {
        const requestData = QueryBalanceRequest.encode({ address: joe, denom: simapp.denomFee }).finish();
        const { value, height } = await queryClient.queryAbci(
          `/cosmos.bank.v1beta1.Query/Balance`,
          requestData,
        );
        const response = QueryBalanceResponse.decode(value);
        expect(response.balance).toEqual(amount);
        expect(height).toEqual(h2);
      }

      // Query at h2 (after send)
      {
        const requestData = QueryBalanceRequest.encode({ address: joe, denom: simapp.denomFee }).finish();
        const { value, height } = await queryClient.queryAbci(
          `/cosmos.bank.v1beta1.Query/Balance`,
          requestData,
          h2,
        );
        const response = QueryBalanceResponse.decode(value);
        expect(response.balance).toEqual(amount);
        expect(height).toEqual(h2);
      }

      // Query at h1 (before send)
      {
        const requestData = QueryBalanceRequest.encode({ address: joe, denom: simapp.denomFee }).finish();
        const { value, height } = await queryClient.queryAbci(
          `/cosmos.bank.v1beta1.Query/Balance`,
          requestData,
          h1,
        );
        const response = QueryBalanceResponse.decode(value);
        expect(response.balance).toEqual({ amount: "0", denom: simapp.denomFee });
        expect(height).toEqual(h1);
      }

      cometClient.disconnect();
    });
  });
});
