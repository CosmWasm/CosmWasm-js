import { Random } from "@cosmjs/crypto";
import { Bech32, fromBase64 } from "@cosmjs/encoding";

import hackatom from "./testdata/contract.json";

/** An internal testing type. SigningCosmWasmClient has a similar but different interface */
export interface ContractUploadInstructions {
  /** The wasm bytecode */
  readonly data: Uint8Array;
  readonly source?: string;
  readonly builder?: string;
}

export function getHackatom(): ContractUploadInstructions {
  return {
    data: fromBase64(hackatom.data),
    source: "https://some.registry.nice/project/raw/0.7/lib/vm/testdata/contract_0.6.wasm.blub.tar.gz",
    builder: "confio/cosmwasm-opt:12.34.56",
  };
}

export function makeRandomAddress(): string {
  return Bech32.encode("cosmos", Random.getBytes(20));
}

export const tendermintIdMatcher = /^[0-9A-F]{64}$/;

// https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#bech32
export const bech32AddressMatcher = /^[\x21-\x7e]{1,83}1[02-9ac-hj-np-z]{38}$/;

/** Deployed as part of scripts/wasmd/init.sh */
export const deployedErc20 = {
  codeId: 1,
  source: "https://crates.io/api/v1/crates/cw-erc20/0.5.1/download",
  builder: "cosmwasm/rust-optimizer:0.8.0",
  checksum: "3e97bf88bd960fee5e5959c77b972eb2927690bc10160792741b174f105ec0c5",
  instances: [
    "cosmos18vd8fpwxzck93qlwghaj6arh4p7c5n89uzcee5", // HASH
    "cosmos1hqrdl6wstt8qzshwc6mrumpjk9338k0lr4dqxd", // ISA
    "cosmos18r5szma8hm93pvx6lwpjwyxruw27e0k5uw835c", // JADE
  ],
};

export const wasmd = {
  endpoint: "http://localhost:1317",
  chainId: "testing",
};

export const alice = {
  mnemonic: "enlist hip relief stomach skate base shallow young switch frequent cry park",
  pubkey0: {
    type: "tendermint/PubKeySecp256k1",
    value: "A9cXhWb8ZpqCzkA8dQCPV29KdeRLV3rUYxrkHudLbQtS",
  },
  address0: "cosmos14qemq0vw6y3gc3u3e0aty2e764u4gs5le3hada",
};

/** Unused account */
export const unused = {
  pubkey: {
    type: "tendermint/PubKeySecp256k1",
    value: "ArkCaFUJ/IH+vKBmNRCdUVl3mCAhbopk9jjW4Ko4OfRQ",
  },
  address: "cosmos1cjsxept9rkggzxztslae9ndgpdyt2408lk850u",
  accountNumber: 19,
  sequence: 0,
};

export function wasmdEnabled(): boolean {
  return !!process.env.WASMD_ENABLED;
}

export function pendingWithoutWasmd(): void {
  if (!wasmdEnabled()) {
    return pending("Set WASMD_ENABLED to enable Wasmd based tests");
  }
}

/** Returns first element. Throws if array has a different length than 1. */
export function fromOneElementArray<T>(elements: ArrayLike<T>): T {
  if (elements.length !== 1) throw new Error(`Expected exactly one element but got ${elements.length}`);
  return elements[0];
}
