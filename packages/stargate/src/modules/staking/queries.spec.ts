/* eslint-disable @typescript-eslint/naming-convention */
import { coin, coins, DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";
import { sleep } from "@cosmjs/utils";
import { MsgDelegate, MsgUndelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";

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
import { MsgDelegateEncodeObject, MsgUndelegateEncodeObject } from "./messages";
import { setupStakingExtension, StakingExtension } from "./queries";

async function makeClientWithStaking(rpcUrl: string): Promise<[QueryClient & StakingExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupStakingExtension), cometClient];
}

describe("StakingExtension", () => {
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

      {
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
      }
      {
        const msg: MsgUndelegate = {
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(100, "ustake"),
        };
        const msgAny: MsgUndelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
          value: msg,
        };
        const memo = "Test undelegation for Stargate";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], defaultFee, memo);
        assertIsDeliverTxSuccess(result);
      }

      await sleep(75); // wait until transactions are indexed
    }
  });

  describe("delegation", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.delegation(faucet.address0, validator.validatorAddress);
      expect(response.delegationResponse).toBeDefined();
      expect(response.delegationResponse).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorDelegations", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.delegatorDelegations(faucet.address0);
      expect(response.delegationResponses).toBeDefined();
      expect(response.delegationResponses).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorUnbondingDelegations", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.delegatorUnbondingDelegations(faucet.address0);
      expect(response.unbondingResponses).toBeDefined();
      expect(response.unbondingResponses).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorValidator", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.delegatorValidator(faucet.address0, validator.validatorAddress);
      expect(response.validator).toBeDefined();
      expect(response.validator).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("delegatorValidators", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.delegatorValidators(faucet.address0);
      expect(response.validators).toBeDefined();
      expect(response.validators).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("historicalInfo", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.historicalInfo(5);
      expect(response.hist).toBeDefined();
      expect(response.hist).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("params", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.params();
      expect(response.params).toBeDefined();
      expect(response.params).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("pool", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.pool();
      expect(response.pool).toBeDefined();
      expect(response.pool).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("redelegations", () => {
    it("works", async () => {
      // TODO: Set up a result for this test
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      await expectAsync(
        client.staking.redelegations(faucet.address0, validator.validatorAddress, validator.validatorAddress),
      ).toBeRejectedWithError(/redelegation not found/i);

      cometClient.disconnect();
    });
  });

  describe("unbondingDelegation", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.unbondingDelegation(faucet.address0, validator.validatorAddress);
      expect(response.unbond).toBeDefined();
      expect(response.unbond).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validator", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.validator(validator.validatorAddress);
      expect(response.validator).toBeDefined();
      expect(response.validator).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validatorDelegations", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.validatorDelegations(validator.validatorAddress);
      expect(response.delegationResponses.length).toBeGreaterThanOrEqual(2);
      // Find the self-delegation
      expect(response.delegationResponses).toContain({
        delegation: {
          delegatorAddress: validator.delegatorAddress,
          validatorAddress: validator.validatorAddress,
          shares: "3000000000000000000000000",
        },
        balance: { denom: "ustake", amount: "3000000" },
      });
      expect(Number(response.pagination!.total)).toBeGreaterThanOrEqual(2);

      cometClient.disconnect();
    });
  });

  describe("validators", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.validators("BOND_STATUS_BONDED");
      expect(response.validators).toBeDefined();
      expect(response.validators).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("validatorUnbondingDelegations", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithStaking(simapp.tendermintUrl);

      const response = await client.staking.validatorUnbondingDelegations(validator.validatorAddress);
      expect(response.unbondingResponses).toBeDefined();
      expect(response.unbondingResponses).not.toBeNull();

      cometClient.disconnect();
    });
  });
});
