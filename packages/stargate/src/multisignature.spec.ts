import {
  createMultisigThresholdPubkey,
  encodeSecp256k1Pubkey,
  makeCosmoshubPath,
  MultisigThresholdPubkey,
  pubkeyToAddress,
  Secp256k1HdWallet,
  StdFee,
} from "@cosmjs/amino";
import { coins, DirectSecp256k1HdWallet, EncodeObject } from "@cosmjs/proto-signing";
import { assert, sleep } from "@cosmjs/utils";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

import { MsgSendEncodeObject } from "./modules";
import { makeCompactBitArray, makeMultisignedTxBytes } from "./multisignature";
import { SignerData, SigningStargateClient } from "./signingstargateclient";
import { assertIsDeliverTxSuccess, StargateClient } from "./stargateclient";
import { faucet, pendingWithoutSimapp, simapp } from "./testutils.spec";

describe("multisignature", () => {
  describe("makeCompactBitArray", () => {
    it("works for 0 bits of different lengths", () => {
      expect(makeCompactBitArray([])).toEqual({ elems: new Uint8Array([]), extraBitsStored: 0 });
      expect(makeCompactBitArray([false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 1,
      });
      expect(makeCompactBitArray([false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 2,
      });
      expect(makeCompactBitArray([false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 3,
      });
      expect(makeCompactBitArray([false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 4,
      });
      expect(makeCompactBitArray([false, false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 5,
      });
      expect(makeCompactBitArray([false, false, false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 6,
      });
      expect(makeCompactBitArray([false, false, false, false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 7,
      });
      expect(makeCompactBitArray([false, false, false, false, false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000]),
        extraBitsStored: 0,
      });
      expect(makeCompactBitArray([false, false, false, false, false, false, false, false, false])).toEqual({
        elems: new Uint8Array([0b00000000, 0b00000000]),
        extraBitsStored: 1,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, false, false, false, false, false]),
      ).toEqual({ elems: new Uint8Array([0b00000000, 0b00000000]), extraBitsStored: 2 });
    });

    it("works for 1 bits of different lengths", () => {
      expect(makeCompactBitArray([])).toEqual({ elems: new Uint8Array([]), extraBitsStored: 0 });
      expect(makeCompactBitArray([true])).toEqual({
        elems: new Uint8Array([0b10000000]),
        extraBitsStored: 1,
      });
      expect(makeCompactBitArray([true, true])).toEqual({
        elems: new Uint8Array([0b11000000]),
        extraBitsStored: 2,
      });
      expect(makeCompactBitArray([true, true, true])).toEqual({
        elems: new Uint8Array([0b11100000]),
        extraBitsStored: 3,
      });
      expect(makeCompactBitArray([true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11110000]),
        extraBitsStored: 4,
      });
      expect(makeCompactBitArray([true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111000]),
        extraBitsStored: 5,
      });
      expect(makeCompactBitArray([true, true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111100]),
        extraBitsStored: 6,
      });
      expect(makeCompactBitArray([true, true, true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111110]),
        extraBitsStored: 7,
      });
      expect(makeCompactBitArray([true, true, true, true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111111]),
        extraBitsStored: 0,
      });
      expect(makeCompactBitArray([true, true, true, true, true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111111, 0b10000000]),
        extraBitsStored: 1,
      });
      expect(makeCompactBitArray([true, true, true, true, true, true, true, true, true, true])).toEqual({
        elems: new Uint8Array([0b11111111, 0b11000000]),
        extraBitsStored: 2,
      });
    });

    it("works for 1 bit in different places", () => {
      expect(
        makeCompactBitArray([true, false, false, false, false, false, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b10000000, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, true, false, false, false, false, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b01000000, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, true, false, false, false, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00100000, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, true, false, false, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00010000, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, true, false, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00001000, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, true, false, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00000100, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, false, true, false, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00000010, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, false, false, true, false, false]),
      ).toEqual({
        elems: new Uint8Array([0b00000001, 0b00000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, false, false, false, true, false]),
      ).toEqual({
        elems: new Uint8Array([0b00000000, 0b10000000]),
        extraBitsStored: 2,
      });
      expect(
        makeCompactBitArray([false, false, false, false, false, false, false, false, false, true]),
      ).toEqual({
        elems: new Uint8Array([0b00000000, 0b01000000]),
        extraBitsStored: 2,
      });
    });
  });

  interface SigningInstructionsAminoJson {
    msgs: readonly EncodeObject[];
    chainId: string;
    sequence: number;
    accountNumber: number;
    fee: StdFee;
    memo: string;
  }

  interface SigningInstructionsDirect extends SigningInstructionsAminoJson {
    multisigPubkey: MultisigThresholdPubkey;
    signers: boolean[];
  }

  describe("makeMultisignedTxBytes", () => {
    const multisigAccountAddress = "cosmos1h90ml36rcu7yegwduzgzderj2jmq49hcpfclw9";

    async function multisig(): Promise<MultisigThresholdPubkey> {
      // In practice we don't need this wallet. Only the pubkeys are needed.
      const allPubkeysWallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [
          makeCosmoshubPath(0),
          makeCosmoshubPath(1),
          makeCosmoshubPath(2),
          makeCosmoshubPath(3),
          makeCosmoshubPath(4),
        ],
      });
      const multisigPubkey = createMultisigThresholdPubkey(
        (await allPubkeysWallet.getAccounts()).map((a) => encodeSecp256k1Pubkey(a.pubkey)),
        2,
      );
      expect(pubkeyToAddress(multisigPubkey, "cosmos")).toEqual(multisigAccountAddress);
      return multisigPubkey;
    }

    it("works for Amino JSON sign mode 5/5", async () => {
      pendingWithoutSimapp();

      // On the composer's machine signing instructions are created.
      // The composer does not need to be one of the signers.
      const signingInstruction: SigningInstructionsAminoJson = await (async () => {
        const client = await StargateClient.connect(simapp.tendermintUrl);
        const accountOnChain = await client.getAccount(multisigAccountAddress);
        assert(accountOnChain, "Account does not exist on chain");

        const msgSend: MsgSend = {
          fromAddress: multisigAccountAddress,
          toAddress: "cosmos19rvl6ja9h0erq9dc2xxfdzypc739ej8k5esnhg",
          amount: coins(1234, "ucosm"),
        };
        const msg: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const gasLimit = 200000;
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: gasLimit.toString(),
        };

        return {
          accountNumber: accountOnChain.accountNumber,
          sequence: accountOnChain.sequence,
          chainId: await client.getChainId(),
          msgs: [msg],
          fee: fee,
          memo: "Use your tokens wisely",
        };
      })();

      const [
        [pubkey0, signature0, bodyBytes],
        [pubkey1, signature1],
        [pubkey2, signature2],
        [pubkey3, signature3],
        [pubkey4, signature4],
      ] = await Promise.all(
        [0, 1, 2, 3, 4].map(async (i) => {
          // Signing environment. Secp256k1HdWallet only supports Amino JSON signing.
          const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
            hdPaths: [makeCosmoshubPath(i)],
          });
          const pubkey = encodeSecp256k1Pubkey((await wallet.getAccounts())[0].pubkey);
          const address = (await wallet.getAccounts())[0].address;
          const signingClient = await SigningStargateClient.offline(wallet);
          const signerData: SignerData = {
            accountNumber: signingInstruction.accountNumber,
            sequence: signingInstruction.sequence,
            chainId: signingInstruction.chainId,
          };
          const { bodyBytes: bb, signatures } = await signingClient.sign(
            address,
            signingInstruction.msgs,
            signingInstruction.fee,
            signingInstruction.memo,
            signerData,
          );
          return [pubkey, signatures[0], bb] as const;
        }),
      );

      // From here on, no private keys are required anymore. Any anonymous entity
      // can collect, assemble and broadcast.
      {
        const multisigPubkey = await multisig();

        const address0 = pubkeyToAddress(pubkey0, "cosmos");
        const address1 = pubkeyToAddress(pubkey1, "cosmos");
        const address2 = pubkeyToAddress(pubkey2, "cosmos");
        const address3 = pubkeyToAddress(pubkey3, "cosmos");
        const address4 = pubkeyToAddress(pubkey4, "cosmos");

        const broadcaster = await StargateClient.connect(simapp.tendermintUrl);
        const signedTx = makeMultisignedTxBytes(
          multisigPubkey,
          signingInstruction.sequence,
          signingInstruction.fee,
          bodyBytes,
          new Map<string, Uint8Array>([
            [address0, signature0],
            [address1, signature1],
            [address2, signature2],
            [address3, signature3],
            [address4, signature4],
          ]),
        );
        // ensure signature is valid
        const result = await broadcaster.broadcastTx(signedTx);
        assertIsDeliverTxSuccess(result);
      }
    });

    it("works for Amino JSON sign mode 2/5", async () => {
      pendingWithoutSimapp();

      // On the composer's machine signing instructions are created.
      // The composer does not need to be one of the signers.
      const signingInstruction: SigningInstructionsAminoJson = await (async () => {
        const client = await StargateClient.connect(simapp.tendermintUrl);
        const accountOnChain = await client.getAccount(multisigAccountAddress);
        assert(accountOnChain, "Account does not exist on chain");

        const msgSend: MsgSend = {
          fromAddress: multisigAccountAddress,
          toAddress: "cosmos19rvl6ja9h0erq9dc2xxfdzypc739ej8k5esnhg",
          amount: coins(1234, "ucosm"),
        };
        const msg: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const gasLimit = 200000;
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: gasLimit.toString(),
        };

        return {
          accountNumber: accountOnChain.accountNumber,
          sequence: accountOnChain.sequence,
          chainId: await client.getChainId(),
          msgs: [msg],
          fee: fee,
          memo: "Use your tokens wisely",
        };
      })();

      const [[pubkey0, signature0, bodyBytes], [pubkey3, signature3]] = await Promise.all(
        [0, 3].map(async (i) => {
          // Signing environment. Secp256k1HdWallet only supports Amino JSON signing.
          const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
            hdPaths: [makeCosmoshubPath(i)],
          });
          const pubkey = encodeSecp256k1Pubkey((await wallet.getAccounts())[0].pubkey);
          const address = (await wallet.getAccounts())[0].address;
          const signingClient = await SigningStargateClient.offline(wallet);
          const signerData: SignerData = {
            accountNumber: signingInstruction.accountNumber,
            sequence: signingInstruction.sequence,
            chainId: signingInstruction.chainId,
          };
          const { bodyBytes: bb, signatures } = await signingClient.sign(
            address,
            signingInstruction.msgs,
            signingInstruction.fee,
            signingInstruction.memo,
            signerData,
          );
          return [pubkey, signatures[0], bb] as const;
        }),
      );

      const multisigPubkey = await multisig();

      // From here on, no private keys are required anymore. Any anonymous entity
      // can collect, assemble and broadcast.
      {
        const address0 = pubkeyToAddress(pubkey0, "cosmos");
        // const address1 = pubkeyToAddress(pubkey1, "cosmos");
        // const address2 = pubkeyToAddress(pubkey2, "cosmos");
        const address3 = pubkeyToAddress(pubkey3, "cosmos");
        // const address4 = pubkeyToAddress(pubkey4, "cosmos");

        const broadcaster = await StargateClient.connect(simapp.tendermintUrl);
        const signedTx = makeMultisignedTxBytes(
          multisigPubkey,
          signingInstruction.sequence,
          signingInstruction.fee,
          bodyBytes,
          new Map<string, Uint8Array>([
            [address0, signature0],
            // [address1, signature1],
            // [address2, signature2],
            [address3, signature3],
            // [address4, signature4],
          ]),
        );
        // ensure signature is valid
        const result = await broadcaster.broadcastTx(signedTx);
        assertIsDeliverTxSuccess(result);
      }
    });

    it("works for Direct sign mode 5/5", async () => {
      pendingWithoutSimapp();

      await sleep(500);

      // On the composer's machine signing instructions are created.
      // The composer does not need to be one of the signers.
      const signingInstruction: SigningInstructionsDirect = await (async () => {
        const client = await StargateClient.connect(simapp.tendermintUrl);
        const accountOnChain = await client.getAccount(multisigAccountAddress);
        assert(accountOnChain, "Account does not exist on chain");

        const msgSend: MsgSend = {
          fromAddress: multisigAccountAddress,
          toAddress: "cosmos19rvl6ja9h0erq9dc2xxfdzypc739ej8k5esnhg",
          amount: coins(1234, "ucosm"),
        };
        const msg: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const gasLimit = 200000;
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: gasLimit.toString(),
        };

        return {
          msgs: [msg],
          chainId: await client.getChainId(),
          multisigPubkey: await multisig(),
          accountNumber: accountOnChain.accountNumber,
          sequence: accountOnChain.sequence,
          signers: [true, true, true, true, true],
          fee: fee,
          memo: "Use your tokens wisely",
        };
      })();

      const [
        [pubkey0, signature0, bodyBytes],
        [pubkey1, signature1],
        [pubkey2, signature2],
        [pubkey3, signature3],
        [pubkey4, signature4],
      ] = await Promise.all(
        [0, 1, 2, 3, 4].map(async (i) => {
          // Signing environment. DirectSecp256k1HdWallet only supports Direct signing.
          const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
            hdPaths: [makeCosmoshubPath(i)],
          });
          const pubkey = encodeSecp256k1Pubkey((await wallet.getAccounts())[0].pubkey);
          const address = (await wallet.getAccounts())[0].address;
          const signingClient = await SigningStargateClient.offline(wallet);
          const { bodyBytes: bb, signatures } = await signingClient.signDirectForMultisig(
            address,
            signingInstruction.msgs,
            signingInstruction.chainId,
            signingInstruction.multisigPubkey,
            signingInstruction.sequence,
            signingInstruction.accountNumber,
            signingInstruction.signers,
            signingInstruction.fee,
            signingInstruction.memo,
          );
          return [pubkey, signatures[0], bb] as const;
        }),
      );

      // From here on, no private keys are required anymore. Any anonymous entity
      // can collect, assemble and broadcast.
      {
        const address0 = pubkeyToAddress(pubkey0, "cosmos");
        const address1 = pubkeyToAddress(pubkey1, "cosmos");
        const address2 = pubkeyToAddress(pubkey2, "cosmos");
        const address3 = pubkeyToAddress(pubkey3, "cosmos");
        const address4 = pubkeyToAddress(pubkey4, "cosmos");

        const broadcaster = await StargateClient.connect(simapp.tendermintUrl);
        const signedTx = makeMultisignedTxBytes(
          signingInstruction.multisigPubkey,
          signingInstruction.sequence,
          signingInstruction.fee,
          bodyBytes,
          new Map<string, Uint8Array>([
            [address0, signature0],
            [address1, signature1],
            [address2, signature2],
            [address3, signature3],
            [address4, signature4],
          ]),
          "direct",
        );
        // ensure signature is valid
        const result = await broadcaster.broadcastTx(signedTx);
        assertIsDeliverTxSuccess(result);
      }
    });

    it("works for Direct sign mode 2/5", async () => {
      pendingWithoutSimapp();

      await sleep(500);

      // On the composer's machine signing instructions are created.
      // The composer does not need to be one of the signers.
      const signingInstruction: SigningInstructionsDirect = await (async () => {
        const client = await StargateClient.connect(simapp.tendermintUrl);
        const accountOnChain = await client.getAccount(multisigAccountAddress);
        assert(accountOnChain, "Account does not exist on chain");

        const msgSend: MsgSend = {
          fromAddress: multisigAccountAddress,
          toAddress: "cosmos19rvl6ja9h0erq9dc2xxfdzypc739ej8k5esnhg",
          amount: coins(1234, "ucosm"),
        };
        const msg: MsgSendEncodeObject = {
          typeUrl: "/cosmos.bank.v1beta1.MsgSend",
          value: msgSend,
        };
        const gasLimit = 200000;
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: gasLimit.toString(),
        };

        return {
          msgs: [msg],
          chainId: await client.getChainId(),
          multisigPubkey: await multisig(),
          accountNumber: accountOnChain.accountNumber,
          sequence: accountOnChain.sequence,
          signers: [true, false, false, true, false],
          fee: fee,
          memo: "Use your tokens wisely",
        };
      })();

      const [[pubkey0, signature0, bodyBytes], [pubkey3, signature3]] = await Promise.all(
        [0, 3].map(async (i) => {
          // Signing environment. DirectSecp256k1HdWallet only supports Direct signing.
          const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
            hdPaths: [makeCosmoshubPath(i)],
          });
          const pubkey = encodeSecp256k1Pubkey((await wallet.getAccounts())[0].pubkey);
          const address = (await wallet.getAccounts())[0].address;
          const signingClient = await SigningStargateClient.offline(wallet);
          const { bodyBytes: bb, signatures } = await signingClient.signDirectForMultisig(
            address,
            signingInstruction.msgs,
            signingInstruction.chainId,
            signingInstruction.multisigPubkey,
            signingInstruction.sequence,
            signingInstruction.accountNumber,
            signingInstruction.signers,
            signingInstruction.fee,
            signingInstruction.memo,
          );
          return [pubkey, signatures[0], bb] as const;
        }),
      );

      // From here on, no private keys are required anymore. Any anonymous entity
      // can collect, assemble and broadcast.
      {
        const address0 = pubkeyToAddress(pubkey0, "cosmos");
        const address3 = pubkeyToAddress(pubkey3, "cosmos");

        const broadcaster = await StargateClient.connect(simapp.tendermintUrl);
        const signedTx = makeMultisignedTxBytes(
          signingInstruction.multisigPubkey,
          signingInstruction.sequence,
          signingInstruction.fee,
          bodyBytes,
          new Map<string, Uint8Array>([
            [address0, signature0],
            [address3, signature3],
          ]),
          "direct",
        );
        // ensure signature is valid
        const result = await broadcaster.broadcastTx(signedTx);
        assertIsDeliverTxSuccess(result);
      }
    });
  });
});
