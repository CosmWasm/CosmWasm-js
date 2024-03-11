import { coin, Secp256k1HdWallet } from "@cosmjs/amino";
import { Random } from "@cosmjs/crypto";
import { fromBech32, toBase64, toBech32 } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet, encodePubkey } from "@cosmjs/proto-signing";

import { calculateFee } from "../../fee";
import { SigningStargateClient } from "../../signingstargateclient";
import { assertIsDeliverTxSuccess } from "../../stargateclient";
import {
  defaultGasPrice,
  defaultSigningClientOptions,
  faucet,
  pendingWithoutSimapp,
  simapp,
} from "../../testutils.spec";
import { MsgCreateValidatorEncodeObject, MsgEditValidatorEncodeObject } from "./messages";

function changePrefix(address: string, newPrefix: string): string {
  return toBech32(newPrefix, fromBech32(address).data);
}

async function sendFeeAndStakingTokens(address: string): Promise<void> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
  const [firstAccount] = await wallet.getAccounts();
  const client = await SigningStargateClient.connectWithSigner(
    simapp.tendermintUrlHttp,
    wallet,
    defaultSigningClientOptions,
  );

  const res = await client.sendTokens(
    firstAccount.address,
    address,
    [coin(15000, simapp.denomFee), coin(28, simapp.denomStaking)],
    "auto",
  );
  assertIsDeliverTxSuccess(res);
  client.disconnect();
}

describe("staking messages", () => {
  const createFee = calculateFee(200_000, defaultGasPrice);
  const editFee = calculateFee(200_000, defaultGasPrice);

  describe("MsgCreateValidator", () => {
    it("works", async () => {
      pendingWithoutSimapp();

      const valWallet = await DirectSecp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrlHttp,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);

      assertIsDeliverTxSuccess(result);

      client.disconnect();
    });

    fit("works with Amino JSON sign mode", async () => {
      pendingWithoutSimapp();
      // if (simapp50Enabled()) pending("Not working, see https://github.com/cosmos/cosmos-sdk/issues/18546");

      const valWallet = await Secp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrlHttp,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "1",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);

      assertIsDeliverTxSuccess(result);

      client.disconnect();
    });
  });

  describe("MsgEditValidator", () => {
    it("works", async () => {
      pendingWithoutSimapp();

      const valWallet = await DirectSecp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrlHttp,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "3",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);
      assertIsDeliverTxSuccess(result);

      const editMsg: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
          // Use empty strings to encode the "do not change" case for those two
          minSelfDelegation: "",
          commissionRate: "",
        },
      };
      const editResult = await client.signAndBroadcast(valAccount.address, [editMsg], editFee);
      assertIsDeliverTxSuccess(editResult);

      // Increase min self delegation
      const editMsg2: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
          minSelfDelegation: "3",
          // Use empty string to encode the "do not change"
          commissionRate: "",
        },
      };
      const editResult2 = await client.signAndBroadcast(valAccount.address, [editMsg2], editFee);
      assertIsDeliverTxSuccess(editResult2);

      client.disconnect();
    });

    fit("works with Amino JSON sign mode", async () => {
      pendingWithoutSimapp();
      // if (simapp50Enabled()) pending("Not working, see https://github.com/cosmos/cosmos-sdk/issues/18546");

      const valWallet = await Secp256k1HdWallet.generate();
      const [valAccount] = await valWallet.getAccounts();

      await sendFeeAndStakingTokens(valAccount.address);

      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrlHttp,
        valWallet,
        defaultSigningClientOptions,
      );

      const createMsg: MsgCreateValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgCreateValidator",
        value: {
          description: {
            moniker: "That's me",
            identity: "AABB1234",
            website: "http://example.com/me",
            details: "What should I write?",
            securityContact: "DM on Twitter",
          },
          commission: {
            maxChangeRate: "10000000000000000", // 0.01
            maxRate: "200000000000000000", // 0.2
            rate: "100000000000000000", // 0.1
          },
          minSelfDelegation: "1",
          // Those two addresses need to be the same with different prefix 🤷‍♂️
          delegatorAddress: valAccount.address,
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"),
          pubkey: encodePubkey({
            type: "tendermint/PubKeyEd25519",
            value: toBase64(Random.getBytes(32)),
          }),
          value: {
            amount: "3",
            denom: simapp.denomStaking,
          },
        },
      };
      const result = await client.signAndBroadcast(valAccount.address, [createMsg], createFee);
      assertIsDeliverTxSuccess(result);

      const editMsg: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
          // Use empty strings to encode the "do not change" case for those two
          minSelfDelegation: "",
          commissionRate: "",
        },
      };
      const editResult = await client.signAndBroadcast(valAccount.address, [editMsg], editFee);
      assertIsDeliverTxSuccess(editResult);

      // Increase min self delegation
      const editMsg2: MsgEditValidatorEncodeObject = {
        typeUrl: "/cosmos.staking.v1beta1.MsgEditValidator",
        value: {
          description: {
            moniker: "new name",
            identity: "ZZZZ",
            website: "http://example.com/new-site",
            details: "Still no idea",
            securityContact: "DM on Discord",
          },
          validatorAddress: changePrefix(valAccount.address, "cosmosvaloper"), // unchanged
          minSelfDelegation: "3",
          // Use empty string to encode the "do not change"
          commissionRate: "",
        },
      };
      const editResult2 = await client.signAndBroadcast(valAccount.address, [editMsg2], editFee);
      assertIsDeliverTxSuccess(editResult2);

      client.disconnect();
    });
  });
});
