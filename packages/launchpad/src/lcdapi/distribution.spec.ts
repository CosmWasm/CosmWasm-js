/* eslint-disable @typescript-eslint/naming-convention */
import { coin, coins, makeSignDoc, makeStdTx, Secp256k1HdWallet } from "@cosmjs/amino";
import { Bech32 } from "@cosmjs/encoding";
import { sleep } from "@cosmjs/utils";

import { assertIsBroadcastTxSuccess } from "../cosmosclient";
import { MsgDelegate } from "../msgs";
import { SigningCosmosClient } from "../signingcosmosclient";
import {
  bigDecimalMatcher,
  faucet,
  launchpad,
  launchpadEnabled,
  nonNegativeIntegerMatcher,
  pendingWithoutLaunchpad,
} from "../testutils.spec";
import { DistributionExtension, setupDistributionExtension } from "./distribution";
import { LcdClient } from "./lcdclient";

function makeDistributionClient(apiUrl: string): LcdClient & DistributionExtension {
  return LcdClient.withExtensions({ apiUrl }, setupDistributionExtension);
}

describe("DistributionExtension", () => {
  const defaultFee = {
    amount: coins(25000, "ucosm"),
    gas: "1500000", // 1.5 million
  };

  beforeAll(async () => {
    if (launchpadEnabled()) {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = new SigningCosmosClient(launchpad.endpoint, faucet.address0, wallet);

      const chainId = await client.getChainId();
      const msg: MsgDelegate = {
        type: "cosmos-sdk/MsgDelegate",
        value: {
          delegator_address: faucet.address0,
          validator_address: launchpad.validator.address,
          amount: coin(25000, "ustake"),
        },
      };
      const memo = "Test delegation for launchpad";
      const { accountNumber, sequence } = await client.getSequence();
      const signDoc = makeSignDoc([msg], defaultFee, chainId, memo, accountNumber, sequence);
      const { signed, signature } = await wallet.signAmino(faucet.address0, signDoc);
      const signedTx = makeStdTx(signed, signature);

      const result = await client.broadcastTx(signedTx);
      assertIsBroadcastTxSuccess(result);

      await sleep(75); // wait until transactions are indexed
    }
  });

  describe("delegatorRewards", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.delegatorRewards(faucet.address0);
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: {
          rewards: [
            {
              validator_address: launchpad.validator.address,
              reward: null,
            },
          ],
          total: null,
        },
      });
    });
  });

  describe("delegatorReward", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.delegatorReward(
        faucet.address0,
        launchpad.validator.address,
      );
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [],
      });
    });
  });

  describe("withdrawAddress", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.withdrawAddress(faucet.address0);
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: faucet.address0,
      });
    });
  });

  describe("validator", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.validator(launchpad.validator.address);
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: {
          // TODO: This smells like a bug in the backend to me
          operator_address: Bech32.encode("cosmos", Bech32.decode(launchpad.validator.address).data),
          self_bond_rewards: [
            { denom: "ucosm", amount: jasmine.stringMatching(bigDecimalMatcher) },
            { denom: "ustake", amount: jasmine.stringMatching(bigDecimalMatcher) },
          ],
          val_commission: [
            { denom: "ucosm", amount: jasmine.stringMatching(bigDecimalMatcher) },
            { denom: "ustake", amount: jasmine.stringMatching(bigDecimalMatcher) },
          ],
        },
      });
    });
  });

  describe("validatorRewards", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.validatorRewards(launchpad.validator.address);
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          { denom: "ucosm", amount: jasmine.stringMatching(bigDecimalMatcher) },
          { denom: "ustake", amount: jasmine.stringMatching(bigDecimalMatcher) },
        ],
      });
    });
  });

  describe("validatorOutstandingRewards", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.validatorOutstandingRewards(launchpad.validator.address);
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          { denom: "ucosm", amount: jasmine.stringMatching(bigDecimalMatcher) },
          { denom: "ustake", amount: jasmine.stringMatching(bigDecimalMatcher) },
        ],
      });
    });
  });

  describe("parameters", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.parameters();
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: {
          community_tax: "0.020000000000000000",
          base_proposer_reward: "0.010000000000000000",
          bonus_proposer_reward: "0.040000000000000000",
          withdraw_addr_enabled: true,
        },
      });
    });
  });

  describe("communityPool", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = makeDistributionClient(launchpad.endpoint);
      const response = await client.distribution.communityPool();
      expect(response).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          { denom: "ucosm", amount: jasmine.stringMatching(bigDecimalMatcher) },
          { denom: "ustake", amount: jasmine.stringMatching(bigDecimalMatcher) },
        ],
      });
    });
  });
});
