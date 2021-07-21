/* eslint-disable @typescript-eslint/naming-convention,no-bitwise */
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { toAscii } from "@cosmjs/encoding";
import { coin, coins, DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { assert, sleep } from "@cosmjs/utils";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { DeepPartial, MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { AuthInfo, TxBody, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import protobuf from "protobufjs/minimal";

import { decodeTxRaw } from "../../proto-signing/build";
import { AminoMsgDelegate } from "./aminomsgs";
import { AminoTypes } from "./aminotypes";
import { MsgDelegateEncodeObject, MsgSendEncodeObject } from "./encodeobjects";
import { PrivateSigningStargateClient, SigningStargateClient } from "./signingstargateclient";
import { assertIsBroadcastTxSuccess } from "./stargateclient";
import {
  defaultSendFee,
  faucet,
  makeRandomAddress,
  ModifyingDirectSecp256k1HdWallet,
  ModifyingSecp256k1HdWallet,
  pendingWithoutSimapp,
  simapp,
  validator,
} from "./testutils.spec";

describe("SigningStargateClient", () => {
  describe("constructor", () => {
    it("can be constructed with custom registry", async () => {
      pendingWithoutSimapp();
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const registry = new Registry();
      registry.register("/custom.MsgCustom", MsgSend);
      const options = { registry: registry };
      const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet, options);
      const openedClient = client as unknown as PrivateSigningStargateClient;
      expect(openedClient.registry.lookupType("/custom.MsgCustom")).toEqual(MsgSend);
    });
  });

  describe("sendTokens", () => {
    it("works with direct signer", async () => {
      pendingWithoutSimapp();
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

      const amount = coins(7890, "ucosm");
      const beneficiaryAddress = makeRandomAddress();
      const memo = "for dinner";

      // no tokens here
      const before = await client.getBalance(beneficiaryAddress, "ucosm");
      expect(before).toEqual({
        denom: "ucosm",
        amount: "0",
      });

      // send
      const result = await client.sendTokens(
        faucet.address0,
        beneficiaryAddress,
        amount,
        defaultSendFee,
        memo,
      );
      assertIsBroadcastTxSuccess(result);
      expect(result.rawLog).toBeTruthy();

      // got tokens
      const after = await client.getBalance(beneficiaryAddress, "ucosm");
      expect(after).toEqual(amount[0]);
    });

    it("works with legacy Amino signer", async () => {
      pendingWithoutSimapp();
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

      const amount = coins(7890, "ucosm");
      const beneficiaryAddress = makeRandomAddress();
      const memo = "for dinner";

      // no tokens here
      const before = await client.getBalance(beneficiaryAddress, "ucosm");
      expect(before).toEqual({
        denom: "ucosm",
        amount: "0",
      });

      // send
      const result = await client.sendTokens(
        faucet.address0,
        beneficiaryAddress,
        amount,
        defaultSendFee,
        memo,
      );
      assertIsBroadcastTxSuccess(result);
      expect(result.rawLog).toBeTruthy();

      // got tokens
      const after = await client.getBalance(beneficiaryAddress, "ucosm");
      expect(after).toEqual(amount[0]);
    });
  });

  describe("signAndBroadcast", () => {
    describe("direct mode", () => {
      it("works", async () => {
        pendingWithoutSimapp();
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg = MsgDelegate.fromPartial({
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        });
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "180000", // 180k
        };
        const memo = "Use your power wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a modifying signer", async () => {
        pendingWithoutSimapp();
        const wallet = await ModifyingDirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg = MsgDelegate.fromPartial({
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        });
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "180000", // 180k
        };
        const memo = "Use your power wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);

        await sleep(1000);

        const searchResult = await client.getTx(result.transactionHash);
        assert(searchResult, "Must find transaction");
        const tx = decodeTxRaw(searchResult.tx);
        // From ModifyingDirectSecp256k1HdWallet
        expect(tx.body.memo).toEqual("This was modified");
        expect({ ...tx.authInfo.fee!.amount[0] }).toEqual(coin(3000, "ucosm"));
        expect(tx.authInfo.fee!.gasLimit.toNumber()).toEqual(333333);
      });
    });

    describe("legacy Amino mode", () => {
      it("works with bank MsgSend", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msgSend: MsgSend = {
          fromAddress: faucet.address0,
          toAddress: makeRandomAddress(),
          amount: coins(1234, "ucosm"),
        };
        const msgAny: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your tokens wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);
      });

      it("works with staking MsgDelegate", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msgDelegate: MsgDelegate = {
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        };
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msgDelegate,
        };
        const fee = {
          amount: coins(2000, "ustake"),
          gas: "200000",
        };
        const memo = "Use your tokens wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a custom registry and custom message", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);

        const customRegistry = new Registry();
        const msgDelegateTypeUrl = "/cosmos.staking.v1beta1.MsgDelegate";
        interface CustomMsgDelegate {
          customDelegatorAddress?: string;
          customValidatorAddress?: string;
          customAmount?: Coin;
        }
        const baseCustomMsgDelegate: CustomMsgDelegate = {
          customDelegatorAddress: "",
          customValidatorAddress: "",
        };
        const CustomMsgDelegate = {
          // Adapted from autogenerated MsgDelegate implementation
          encode(
            message: CustomMsgDelegate,
            writer: protobuf.Writer = protobuf.Writer.create(),
          ): protobuf.Writer {
            writer.uint32(10).string(message.customDelegatorAddress ?? "");
            writer.uint32(18).string(message.customValidatorAddress ?? "");
            if (message.customAmount !== undefined && message.customAmount !== undefined) {
              Coin.encode(message.customAmount, writer.uint32(26).fork()).ldelim();
            }
            return writer;
          },

          decode(): CustomMsgDelegate {
            throw new Error("decode method should not be required");
          },

          fromJSON(): CustomMsgDelegate {
            throw new Error("fromJSON method should not be required");
          },

          fromPartial(object: DeepPartial<CustomMsgDelegate>): CustomMsgDelegate {
            const message = { ...baseCustomMsgDelegate } as CustomMsgDelegate;
            if (object.customDelegatorAddress !== undefined && object.customDelegatorAddress !== null) {
              message.customDelegatorAddress = object.customDelegatorAddress;
            } else {
              message.customDelegatorAddress = "";
            }
            if (object.customValidatorAddress !== undefined && object.customValidatorAddress !== null) {
              message.customValidatorAddress = object.customValidatorAddress;
            } else {
              message.customValidatorAddress = "";
            }
            if (object.customAmount !== undefined && object.customAmount !== null) {
              message.customAmount = Coin.fromPartial(object.customAmount);
            } else {
              message.customAmount = undefined;
            }
            return message;
          },

          toJSON(): unknown {
            throw new Error("toJSON method should not be required");
          },
        };
        customRegistry.register(msgDelegateTypeUrl, CustomMsgDelegate);
        const customAminoTypes = new AminoTypes({
          additions: {
            "/cosmos.staking.v1beta1.MsgDelegate": {
              aminoType: "cosmos-sdk/MsgDelegate",
              toAmino: ({
                customDelegatorAddress,
                customValidatorAddress,
                customAmount,
              }: CustomMsgDelegate): AminoMsgDelegate["value"] => {
                assert(customDelegatorAddress, "missing customDelegatorAddress");
                assert(customValidatorAddress, "missing validatorAddress");
                assert(customAmount, "missing amount");
                return {
                  delegator_address: customDelegatorAddress,
                  validator_address: customValidatorAddress,
                  amount: {
                    amount: customAmount.amount,
                    denom: customAmount.denom,
                  },
                };
              },
              fromAmino: ({
                delegator_address,
                validator_address,
                amount,
              }: AminoMsgDelegate["value"]): CustomMsgDelegate => ({
                customDelegatorAddress: delegator_address,
                customValidatorAddress: validator_address,
                customAmount: Coin.fromPartial(amount),
              }),
            },
          },
        });
        const options = { registry: customRegistry, aminoTypes: customAminoTypes };
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet, options);

        const msg: CustomMsgDelegate = {
          customDelegatorAddress: faucet.address0,
          customValidatorAddress: validator.validatorAddress,
          customAmount: coin(1234, "ustake"),
        };
        const msgAny = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your power wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a modifying signer", async () => {
        pendingWithoutSimapp();
        const wallet = await ModifyingSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg: MsgDelegate = {
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        };
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your power wisely";
        const result = await client.signAndBroadcast(faucet.address0, [msgAny], fee, memo);
        assertIsBroadcastTxSuccess(result);

        await sleep(1000);

        const searchResult = await client.getTx(result.transactionHash);
        assert(searchResult, "Must find transaction");
        const tx = decodeTxRaw(searchResult.tx);
        // From ModifyingSecp256k1HdWallet
        expect(tx.body.memo).toEqual("This was modified");
        expect({ ...tx.authInfo.fee!.amount[0] }).toEqual(coin(3000, "ucosm"));
        expect(tx.authInfo.fee!.gasLimit.toNumber()).toEqual(333333);
      });
    });
  });

  describe("sign", () => {
    describe("direct mode", () => {
      it("works", async () => {
        pendingWithoutSimapp();
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg = MsgDelegate.fromPartial({
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        });
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "180000", // 180k
        };
        const memo = "Use your power wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a modifying signer", async () => {
        pendingWithoutSimapp();
        const wallet = await ModifyingDirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg = MsgDelegate.fromPartial({
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        });
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "180000", // 180k
        };
        const memo = "Use your power wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        const body = TxBody.decode(signed.bodyBytes);
        const authInfo = AuthInfo.decode(signed.authInfoBytes);
        // From ModifyingDirectSecp256k1HdWallet
        expect(body.memo).toEqual("This was modified");
        expect({ ...authInfo.fee!.amount[0] }).toEqual(coin(3000, "ucosm"));
        expect(authInfo.fee!.gasLimit.toNumber()).toEqual(333333);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });
    });

    describe("legacy Amino mode", () => {
      it("works with bank MsgSend", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msgSend: MsgSend = {
          fromAddress: faucet.address0,
          toAddress: makeRandomAddress(),
          amount: coins(1234, "ucosm"),
        };
        const msgAny: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your tokens wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });

      it("works with staking MsgDelegate", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msgDelegate: MsgDelegate = {
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        };
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msgDelegate,
        };
        const fee = {
          amount: coins(2000, "ustake"),
          gas: "200000",
        };
        const memo = "Use your tokens wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a custom registry and custom message", async () => {
        pendingWithoutSimapp();
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);

        const customRegistry = new Registry();
        const msgDelegateTypeUrl = "/cosmos.staking.v1beta1.MsgDelegate";
        interface CustomMsgDelegate {
          customDelegatorAddress?: string;
          customValidatorAddress?: string;
          customAmount?: Coin;
        }
        const baseCustomMsgDelegate: CustomMsgDelegate = {
          customDelegatorAddress: "",
          customValidatorAddress: "",
        };
        const CustomMsgDelegate = {
          // Adapted from autogenerated MsgDelegate implementation
          encode(
            message: CustomMsgDelegate,
            writer: protobuf.Writer = protobuf.Writer.create(),
          ): protobuf.Writer {
            writer.uint32(10).string(message.customDelegatorAddress ?? "");
            writer.uint32(18).string(message.customValidatorAddress ?? "");
            if (message.customAmount !== undefined && message.customAmount !== undefined) {
              Coin.encode(message.customAmount, writer.uint32(26).fork()).ldelim();
            }
            return writer;
          },

          decode(): CustomMsgDelegate {
            throw new Error("decode method should not be required");
          },

          fromJSON(): CustomMsgDelegate {
            throw new Error("fromJSON method should not be required");
          },

          fromPartial(object: DeepPartial<CustomMsgDelegate>): CustomMsgDelegate {
            const message = { ...baseCustomMsgDelegate } as CustomMsgDelegate;
            if (object.customDelegatorAddress !== undefined && object.customDelegatorAddress !== null) {
              message.customDelegatorAddress = object.customDelegatorAddress;
            } else {
              message.customDelegatorAddress = "";
            }
            if (object.customValidatorAddress !== undefined && object.customValidatorAddress !== null) {
              message.customValidatorAddress = object.customValidatorAddress;
            } else {
              message.customValidatorAddress = "";
            }
            if (object.customAmount !== undefined && object.customAmount !== null) {
              message.customAmount = Coin.fromPartial(object.customAmount);
            } else {
              message.customAmount = undefined;
            }
            return message;
          },

          toJSON(): unknown {
            throw new Error("toJSON method should not be required");
          },
        };
        customRegistry.register(msgDelegateTypeUrl, CustomMsgDelegate);
        const customAminoTypes = new AminoTypes({
          additions: {
            "/cosmos.staking.v1beta1.MsgDelegate": {
              aminoType: "cosmos-sdk/MsgDelegate",
              toAmino: ({
                customDelegatorAddress,
                customValidatorAddress,
                customAmount,
              }: CustomMsgDelegate): AminoMsgDelegate["value"] => {
                assert(customDelegatorAddress, "missing customDelegatorAddress");
                assert(customValidatorAddress, "missing validatorAddress");
                assert(customAmount, "missing amount");
                return {
                  delegator_address: customDelegatorAddress,
                  validator_address: customValidatorAddress,
                  amount: {
                    amount: customAmount.amount,
                    denom: customAmount.denom,
                  },
                };
              },
              fromAmino: ({
                delegator_address,
                validator_address,
                amount,
              }: AminoMsgDelegate["value"]): CustomMsgDelegate => ({
                customDelegatorAddress: delegator_address,
                customValidatorAddress: validator_address,
                customAmount: Coin.fromPartial(amount),
              }),
            },
          },
        });
        const options = { registry: customRegistry, aminoTypes: customAminoTypes };
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet, options);

        const msg: CustomMsgDelegate = {
          customDelegatorAddress: faucet.address0,
          customValidatorAddress: validator.validatorAddress,
          customAmount: coin(1234, "ustake"),
        };
        const msgAny = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your power wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });

      it("works with a modifying signer", async () => {
        pendingWithoutSimapp();
        const wallet = await ModifyingSecp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = await SigningStargateClient.connectWithSigner(simapp.tendermintUrl, wallet);

        const msg: MsgDelegate = {
          delegatorAddress: faucet.address0,
          validatorAddress: validator.validatorAddress,
          amount: coin(1234, "ustake"),
        };
        const msgAny: MsgDelegateEncodeObject = {
          typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
          value: msg,
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "200000",
        };
        const memo = "Use your power wisely";
        const signed = await client.sign(faucet.address0, [msgAny], fee, memo);

        const body = TxBody.decode(signed.bodyBytes);
        const authInfo = AuthInfo.decode(signed.authInfoBytes);
        // From ModifyingSecp256k1HdWallet
        expect(body.memo).toEqual("This was modified");
        expect({ ...authInfo.fee!.amount[0] }).toEqual(coin(3000, "ucosm"));
        expect(authInfo.fee!.gasLimit.toNumber()).toEqual(333333);

        // ensure signature is valid
        const result = await client.broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()));
        assertIsBroadcastTxSuccess(result);
      });
    });
  });

  describe("experimentalAdr36Sign", () => {
    it("works", async () => {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.offline(wallet);
      const [firstAccount] = await wallet.getAccounts();

      const data = toAscii("Hello, world");
      const signed = await client.experimentalAdr36Sign(firstAccount.address, data);
      expect(signed).toEqual({
        msg: [
          {
            type: "sign/MsgSignData",
            value: {
              signer: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
              data: "SGVsbG8sIHdvcmxk", // echo -n "Hello, world" | base64
            },
          },
        ],
        fee: {
          amount: [],
          gas: "0",
        },
        signatures: [
          {
            pub_key: {
              type: "tendermint/PubKeySecp256k1",
              value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
            },
            signature:
              "x9jjSFv8/n1F8gOSRjddakYDbvroQm8ZoDWht/Imc1t5xUW49+Xaq7gwcsE+LCpqYoTBxnaXLg/xgJjYymCWvw==",
          },
        ],
        memo: "",
      });
    });

    it("works for multiple datas", async () => {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.offline(wallet);
      const [firstAccount] = await wallet.getAccounts();

      const data1 = toAscii("Hello");
      const data2 = toAscii("World");
      const signed = await client.experimentalAdr36Sign(firstAccount.address, [data1, data2]);
      expect(signed).toEqual({
        msg: [
          {
            type: "sign/MsgSignData",
            value: {
              signer: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
              data: "SGVsbG8=", // echo -n "Hello" | base64
            },
          },
          {
            type: "sign/MsgSignData",
            value: {
              signer: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
              data: "V29ybGQ=", // echo -n "World" | base64
            },
          },
        ],
        fee: {
          amount: [],
          gas: "0",
        },
        signatures: [
          {
            pub_key: {
              type: "tendermint/PubKeySecp256k1",
              value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
            },
            signature:
              "KvN9FM/WSfsJERv4PS91Ey7SUrnVJ/XHpHmMDh0sC94Niz2JLfF9KKE1QMfL5KtVFSRdMkJJsMtgl+aCaUyOCw==",
          },
        ],
        memo: "",
      });
    });
  });

  describe("experimentalAdr36Verify", () => {
    it("works", async () => {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.offline(wallet);
      const [firstAccount] = await wallet.getAccounts();

      const data = toAscii("Hello, world");
      const signed = await client.experimentalAdr36Sign(firstAccount.address, data);
      const ok = await SigningStargateClient.experimentalAdr36Verify(signed);
      expect(ok).toEqual(true);
    });

    it("works with multiple datas", async () => {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const client = await SigningStargateClient.offline(wallet);
      const [firstAccount] = await wallet.getAccounts();

      const data1 = toAscii("Hello");
      const data2 = toAscii("World");
      const signed = await client.experimentalAdr36Sign(firstAccount.address, [data1, data2]);
      const ok = await SigningStargateClient.experimentalAdr36Verify(signed);
      expect(ok).toEqual(true);
    });
  });
});
