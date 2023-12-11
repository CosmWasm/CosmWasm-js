/* eslint-disable @typescript-eslint/naming-convention */
import { coin, coins, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";
import { sleep } from "@cosmjs/utils";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";

import { QueryClient } from "../../queryclient";
import { SigningStargateClient } from "../../signingstargateclient";
import { assertIsDeliverTxSuccess } from "../../stargateclient";
import {
  defaultSigningClientOptions,
  faucet,
  pendingWithoutSimapp,
  simapp,
  simappEnabled,
  validator,
} from "../../testutils.spec";
import { MsgDelegateEncodeObject } from "../";
import { DistributionExtension, setupDistributionExtension } from "./queries";

async function makeClientWithDistribution(
  rpcUrl: string,
): Promise<[QueryClient & DistributionExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupDistributionExtension), cometClient];
}

describe("DistributionExtension", () => {
  const defaultFee = {
    amount: coins(25000, "ucosm"),
    gas: "1500000", // 1.5 million
  };

  beforeAll(async () => {
    if (simappEnabled()) {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        wallet,
        defaultSigningClientOptions,
      );

      const msg: MsgDelegate = {
        delegatorAddress: faucet.address0,
        validatorAddress: validator.validatorAddress,
        amount: coin(25000, "ustake"),
      };
      const msgAny: MsgDelegateEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
        value: msg,
      };
      const memo = "Test delegation for Stargate";
      const result = await client.signAndBroadcast(faucet.address0, [msgAny], defaultFee, memo);
      assertIsDeliverTxSuccess(result);

      await sleep(75); // wait until transactions are indexed
    }
  });

  describe("communityPool", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.communityPool();
      expect(response.pool).toBeDefined();
      expect(response.pool).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegationRewards", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.delegationRewards(
        faucet.address0,
        validator.validatorAddress,
      );
      expect(response.rewards).toBeDefined();
      expect(response.rewards).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegationTotalRewards", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.delegationTotalRewards(faucet.address0);
      expect(response.rewards).toBeDefined();
      expect(response.rewards).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorValidators", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.delegatorValidators(faucet.address0);
      expect(response.validators).toBeDefined();
      expect(response.validators).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorWithdrawAddress", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.delegatorWithdrawAddress(faucet.address0);
      expect(response.withdrawAddress).toBeDefined();
      expect(response.withdrawAddress).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("params", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.params();
      expect(response.params).toBeDefined();
      expect(response.params).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validatorCommission", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.validatorCommission(validator.validatorAddress);
      expect(response.commission).toBeDefined();
      expect(response.commission).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validatorOutstandingRewards", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.validatorOutstandingRewards(validator.validatorAddress);
      expect(response.rewards).toBeDefined();
      expect(response.rewards).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validatorSlashes", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithDistribution(simapp.tendermintUrl);

      const response = await client.distribution.validatorSlashes(validator.validatorAddress, 1, 5);
      expect(response.slashes).toBeDefined();
      expect(response.slashes).not.toBeNull();

      cometClient.disconnect();
    });
  });
});
