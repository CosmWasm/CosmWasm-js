import { MultisigThresholdPubkey, pubkeyToAddress, StdFee } from "@cosmjs/amino";
import { fromBech32 } from "@cosmjs/encoding";
import { encodePubkey } from "@cosmjs/proto-signing";
import { CompactBitArray, MultiSignature } from "cosmjs-types/cosmos/crypto/multisig/v1beta1/multisig";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { AuthInfo, SignerInfo } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import Long from "long";

export function makeCompactBitArray(bits: readonly boolean[]): CompactBitArray {
  const byteCount = Math.ceil(bits.length / 8);
  const extraBits = bits.length - Math.floor(bits.length / 8) * 8;
  const bytes = new Uint8Array(byteCount); // zero-filled

  bits.forEach((value, index) => {
    const bytePos = Math.floor(index / 8);
    const bitPos = index % 8;
    // eslint-disable-next-line no-bitwise
    if (value) bytes[bytePos] |= 0b1 << (8 - 1 - bitPos);
  });

  return CompactBitArray.fromPartial({ elems: bytes, extraBitsStored: extraBits });
}

export function makeAuthInfoBytesForMultisig(
  multisigPubkey: MultisigThresholdPubkey,
  sequence: number,
  fee: StdFee,
  signers: boolean[],
  signModes: Array<"amino_json" | "direct">,
): Uint8Array {
  const signerInfo: SignerInfo = {
    publicKey: encodePubkey(multisigPubkey),
    modeInfo: {
      multi: {
        bitarray: makeCompactBitArray(signers),
        // This feels needs one entry per actual signature
        modeInfos: signModes.map((signMode) => ({
          // here we assume the signers themselves are no multisigs
          single: {
            mode: signMode === "direct" ? SignMode.SIGN_MODE_DIRECT : SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
          },
        })),
      },
    },
    sequence: Long.fromNumber(sequence),
  };

  const authInfo = AuthInfo.fromPartial({
    signerInfos: [signerInfo],
    fee: {
      amount: [...fee.amount],
      gasLimit: Long.fromString(fee.gas),
    },
  });

  return AuthInfo.encode(authInfo).finish();
}

/**
 * Creates a signed transaction from signer info, transaction body and signatures.
 * The result can be broadcasted after serialization.
 *
 * Consider using `makeMultisignedTxBytes` instead if you want to broadcast the
 * transaction immediately.
 *
 * @param signMode is the sign mode used by all signers. Mixed signing mode is not yet supported.
 */
export function makeMultisignedTx(
  multisigPubkey: MultisigThresholdPubkey,
  sequence: number,
  fee: StdFee,
  bodyBytes: Uint8Array,
  signatures: Map<string, Uint8Array>,
  signMode: "amino_json" | "direct" = "amino_json",
): TxRaw {
  const addresses = Array.from(signatures.keys());
  const prefix = fromBech32(addresses[0]).prefix;

  const signers: boolean[] = Array(multisigPubkey.value.pubkeys.length).fill(false);
  const signaturesList = new Array<Uint8Array>();
  for (let i = 0; i < multisigPubkey.value.pubkeys.length; i++) {
    const signerAddress = pubkeyToAddress(multisigPubkey.value.pubkeys[i], prefix);
    const signature = signatures.get(signerAddress);
    if (signature) {
      signers[i] = true;
      signaturesList.push(signature);
    }
  }

  const authInfoBytes = makeAuthInfoBytesForMultisig(
    multisigPubkey,
    sequence,
    fee,
    signers,
    signaturesList.map((_sig) => signMode),
  );
  const signedTx = TxRaw.fromPartial({
    bodyBytes: bodyBytes,
    authInfoBytes: authInfoBytes,
    signatures: [MultiSignature.encode(MultiSignature.fromPartial({ signatures: signaturesList })).finish()],
  });
  return signedTx;
}

/**
 * Creates a signed transaction from signer info, transaction body and signatures.
 * The result can be broadcasted.
 *
 * This is a wrapper around `makeMultisignedTx` that encodes the transaction for broadcasting.
 */
export function makeMultisignedTxBytes(
  multisigPubkey: MultisigThresholdPubkey,
  sequence: number,
  fee: StdFee,
  bodyBytes: Uint8Array,
  signatures: Map<string, Uint8Array>,
  signMode: "amino_json" | "direct" = "amino_json",
): Uint8Array {
  const signedTx = makeMultisignedTx(multisigPubkey, sequence, fee, bodyBytes, signatures, signMode);
  return Uint8Array.from(TxRaw.encode(signedTx).finish());
}
