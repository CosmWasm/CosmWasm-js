import { toHex } from "@cosmjs/encoding";
import { Uint53 } from "@cosmjs/math";

import { pubkeyToRawAddress } from "./addresses";
import { MultisigThresholdPubkey, SinglePubkey } from "./pubkeys";

/**
 * Compare arrays lexicographically.
 *
 * Returns value < 0 if `a < b`.
 * Returns value > 0 if `a > b`.
 * Returns 0 if `a === b`.
 */
export function compareArrays(a: Uint8Array, b: Uint8Array): number {
  const aHex = toHex(a);
  const bHex = toHex(b);
  return aHex === bHex ? 0 : aHex < bHex ? -1 : 1;
}

/**
 * Creates a multisig pubkey of type tendermint/PubKeyMultisigThreshold.
 * This is a single pubkey which internally includes the list of potential signers
 * as well as the threshold value.
 *
 * The provided pubkeys are sorted internally. For some rare cases where unsorted
 * multisig addresses have been created you can set the `nosort` argument to true
 * to deactivate the sorting.
 */
export function createMultisigThresholdPubkey(
  pubkeys: readonly SinglePubkey[],
  threshold: number,
  nosort = false,
): MultisigThresholdPubkey {
  const uintThreshold = new Uint53(threshold);
  if (uintThreshold.toNumber() > pubkeys.length) {
    throw new Error(`Threshold k = ${uintThreshold.toNumber()} exceeds number of keys n = ${pubkeys.length}`);
  }

  const outPubkeys = nosort
    ? pubkeys
    : Array.from(pubkeys).sort((lhs, rhs) => {
        // https://github.com/cosmos/cosmos-sdk/blob/v0.42.2/client/keys/add.go#L172-L174
        const addressLhs = pubkeyToRawAddress(lhs);
        const addressRhs = pubkeyToRawAddress(rhs);
        return compareArrays(addressLhs, addressRhs);
      });
  return {
    type: "tendermint/PubKeyMultisigThreshold",
    value: {
      threshold: uintThreshold.toString(),
      pubkeys: outPubkeys,
    },
  };
}
