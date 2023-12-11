/* eslint-disable @typescript-eslint/naming-convention */
import { AminoSignResponse, Secp256k1HdWallet, Secp256k1HdWalletOptions, StdSignDoc } from "@cosmjs/amino";
import { Bip39, EnglishMnemonic, Random } from "@cosmjs/crypto";
import { fromBase64, toBech32 } from "@cosmjs/encoding";
import {
  DirectSecp256k1HdWallet,
  DirectSecp256k1HdWalletOptions,
  DirectSignResponse,
  makeAuthInfoBytes,
} from "@cosmjs/proto-signing";
import {
  AuthExtension,
  BankExtension,
  calculateFee,
  coins,
  GasPrice,
  QueryClient,
  setupAuthExtension,
  setupBankExtension,
} from "@cosmjs/stargate";
import { connectComet } from "@cosmjs/tendermint-rpc";
import { assertDefinedAndNotNull } from "@cosmjs/utils";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { AuthInfo, SignDoc, TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import { setupWasmExtension, WasmExtension } from "./modules";
import { SigningCosmWasmClientOptions } from "./signingcosmwasmclient";
import hackatom from "./testdata/contract.json";

export const defaultGasPrice = GasPrice.fromString("0.025ucosm");
export const defaultSendFee = calculateFee(100_000, defaultGasPrice);
export const defaultUploadFee = calculateFee(1_500_000, defaultGasPrice);
export const defaultInstantiateFee = calculateFee(500_000, defaultGasPrice);
export const defaultExecuteFee = calculateFee(200_000, defaultGasPrice);
export const defaultMigrateFee = calculateFee(200_000, defaultGasPrice);
export const defaultUpdateAdminFee = calculateFee(80_000, defaultGasPrice);
export const defaultClearAdminFee = calculateFee(80_000, defaultGasPrice);

/** An internal testing type. SigningCosmWasmClient has a similar but different interface */
export interface ContractUploadInstructions {
  /** The wasm bytecode */
  readonly data: Uint8Array;
}

export const wasmd = {
  blockTime: 1_000, // ms
  chainId: "testing",
  endpoint: "http://localhost:26659",
  prefix: "wasm",
  validator: {
    address: "wasmvaloper1m4vhsgne6u74ff78vf0tvkjq3q4hjf9vjfrmy2",
  },
};

/** Setting to speed up testing */
export const defaultSigningClientOptions: SigningCosmWasmClientOptions = {
  broadcastPollIntervalMs: 300,
  broadcastTimeoutMs: 8_000,
  gasPrice: defaultGasPrice,
};

export function getHackatom(): ContractUploadInstructions {
  return {
    data: fromBase64(hackatom.data),
  };
}

export function makeRandomAddress(): string {
  return toBech32("wasm", Random.getBytes(20));
}

export const tendermintIdMatcher = /^[0-9A-F]{64}$/;
/** @see https://rgxdb.com/r/1NUN74O6 */
export const base64Matcher =
  /^(?:[a-zA-Z0-9+/]{4})*(?:|(?:[a-zA-Z0-9+/]{3}=)|(?:[a-zA-Z0-9+/]{2}==)|(?:[a-zA-Z0-9+/]{1}===))$/;
// https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#bech32
export const bech32AddressMatcher = /^[\x21-\x7e]{1,83}1[02-9ac-hj-np-z]{38,58}$/;

export const alice = {
  mnemonic: "enlist hip relief stomach skate base shallow young switch frequent cry park",
  pubkey0: {
    type: "tendermint/PubKeySecp256k1",
    value: "A9cXhWb8ZpqCzkA8dQCPV29KdeRLV3rUYxrkHudLbQtS",
  },
  address0: "wasm14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk",
  address1: "wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y",
  address2: "wasm1xv9tklw7d82sezh9haa573wufgy59vmwnxhnsl",
  address3: "wasm17yg9mssjenmc3jkqth6ulcwj9cxujrxxg9nmzk",
  address4: "wasm1f7j7ryulwjfe9ljplvhtcaxa6wqgula3nh873j",
};

/** Unused account */
export const unused = {
  pubkey: {
    type: "tendermint/PubKeySecp256k1",
    value: "ArkCaFUJ/IH+vKBmNRCdUVl3mCAhbopk9jjW4Ko4OfRQ",
  },
  address: "wasm1cjsxept9rkggzxztslae9ndgpdyt240842kpxh",
  accountNumber: 16,
  sequence: 0,
};

export const validator = {
  /**
   * delegator_address from /cosmos.staking.v1beta1.MsgCreateValidator in scripts/wasmd/template/.wasmd/config/genesis.json
   *
   * `jq ".app_state.genutil.gen_txs[0].body.messages[0].delegator_address" scripts/wasmd/template/.wasmd/config/genesis.json`
   */
  delegatorAddress: "wasm1g6kvj7w4c8g0vhl35kjgpe3jmuauet0e5tnevj",
  /**
   * validator_address from /cosmos.staking.v1beta1.MsgCreateValidator in scripts/wasmd/template/.wasmd/config/genesis.json
   *
   * `jq ".app_state.genutil.gen_txs[0].body.messages[0].validator_address" scripts/wasmd/template/.wasmd/config/genesis.json`
   */
  validatorAddress: "wasmvaloper1g6kvj7w4c8g0vhl35kjgpe3jmuauet0ephx9zg",
  accountNumber: 0,
  sequence: 1,
};

/** Deployed as part of scripts/wasmd/init.sh */
export const deployedHackatom = {
  codeId: 1,
  checksum: "13a1fc994cc6d1c81b746ee0c0ff6f90043875e0bf1d9be6b7d779fc978dc2a5",
  instances: [
    {
      beneficiary: alice.address0,
      address: "wasm14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0phg4d",
      label: "From deploy_hackatom.js (0)",
    },
    {
      beneficiary: alice.address1,
      address: "wasm1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrss5maay",
      label: "From deploy_hackatom.js (1)",
    },
    {
      beneficiary: alice.address2,
      address: "wasm1yyca08xqdgvjz0psg56z67ejh9xms6l436u8y58m82npdqqhmmtqas0cl7",
      label: "From deploy_hackatom.js (2)",
    },
  ],
};

/** Deployed as part of scripts/wasmd/init.sh */
export const deployedIbcReflect = {
  codeId: 2,
  instances: [
    {
      address: "wasm1aakfpghcanxtc45gpqlx8j3rq0zcpyf49qmhm9mdjrfx036h4z5se0hfnq",
      ibcPortId: "wasm.wasm1aakfpghcanxtc45gpqlx8j3rq0zcpyf49qmhm9mdjrfx036h4z5se0hfnq",
    },
  ],
};

export function wasmdEnabled(): boolean {
  return !!process.env.WASMD_ENABLED;
}

export function pendingWithoutWasmd(): void {
  if (!wasmdEnabled()) {
    return pending("Set WASMD_ENABLED to enable Wasmd-based tests");
  }
}

/** Returns first element. Throws if array has a different length than 1. */
export function fromOneElementArray<T>(elements: ArrayLike<T>): T {
  if (elements.length !== 1) throw new Error(`Expected exactly one element but got ${elements.length}`);
  return elements[0];
}

export async function makeWasmClient(
  endpoint: string,
): Promise<QueryClient & AuthExtension & BankExtension & WasmExtension> {
  const cometClient = await connectComet(endpoint);
  return QueryClient.withExtensions(cometClient, setupAuthExtension, setupBankExtension, setupWasmExtension);
}

/**
 * A class for testing clients using an Amino signer which modifies the transaction it receives before signing
 */
export class ModifyingSecp256k1HdWallet extends Secp256k1HdWallet {
  public static override async fromMnemonic(
    mnemonic: string,
    options: Partial<Secp256k1HdWalletOptions> = {},
  ): Promise<ModifyingSecp256k1HdWallet> {
    const mnemonicChecked = new EnglishMnemonic(mnemonic);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked, options.bip39Password);
    return new ModifyingSecp256k1HdWallet(mnemonicChecked, { ...options, seed: seed });
  }

  public override async signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse> {
    const modifiedSignDoc = {
      ...signDoc,
      fee: {
        amount: coins(3000, "ucosm"),
        gas: "333333",
      },
      memo: "This was modified",
    };
    return super.signAmino(signerAddress, modifiedSignDoc);
  }
}

/**
 * A class for testing clients using a direct signer which modifies the transaction it receives before signing
 */
export class ModifyingDirectSecp256k1HdWallet extends DirectSecp256k1HdWallet {
  public static override async fromMnemonic(
    mnemonic: string,
    options: Partial<DirectSecp256k1HdWalletOptions> = {},
  ): Promise<DirectSecp256k1HdWallet> {
    const mnemonicChecked = new EnglishMnemonic(mnemonic);
    const seed = await Bip39.mnemonicToSeed(mnemonicChecked, options.bip39Password);
    return new ModifyingDirectSecp256k1HdWallet(mnemonicChecked, { ...options, seed: seed });
  }

  public override async signDirect(address: string, signDoc: SignDoc): Promise<DirectSignResponse> {
    const txBody = TxBody.decode(signDoc.bodyBytes);
    const modifiedTxBody = TxBody.fromPartial({
      ...txBody,
      memo: "This was modified",
    });
    const authInfo = AuthInfo.decode(signDoc.authInfoBytes);
    const signers = authInfo.signerInfos.map((signerInfo) => {
      assertDefinedAndNotNull(signerInfo.publicKey);
      return {
        pubkey: signerInfo.publicKey,
        sequence: Number(signerInfo.sequence),
      };
    });
    const modifiedFeeAmount = coins(3000, "ucosm");
    const modifiedGasLimit = 333333;
    const modifiedFeeGranter = undefined;
    const modifiedFeePayer = undefined;
    const modifiedSignDoc = {
      ...signDoc,
      bodyBytes: Uint8Array.from(TxBody.encode(modifiedTxBody).finish()),
      authInfoBytes: makeAuthInfoBytes(
        signers,
        modifiedFeeAmount,
        modifiedGasLimit,
        modifiedFeeGranter,
        modifiedFeePayer,
        SignMode.SIGN_MODE_DIRECT,
      ),
    };
    return super.signDirect(address, modifiedSignDoc);
  }
}
