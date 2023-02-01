import { toAscii } from "@cosmjs/encoding";
import { Uint32, Uint53 } from "@cosmjs/math";
import * as secp256k1 from "@noble/secp256k1";
import BN from "bn.js";

import { Hmac } from "./hmac";
import { Sha512 } from "./sha";

function fromBeBytes(data: Uint8Array): bigint {
  return BigInt(new BN(data).toString(10));
}

export interface Slip10Result {
  readonly chainCode: Uint8Array;
  readonly privkey: Uint8Array;
}

/**
 * Raw values must match the curve string in SLIP-0010 master key generation
 *
 * @see https://github.com/satoshilabs/slips/blob/master/slip-0010.md#master-key-generation
 */
export enum Slip10Curve {
  Secp256k1 = "Bitcoin seed",
  Ed25519 = "ed25519 seed",
}

/**
 * Reverse mapping of Slip10Curve
 */
export function slip10CurveFromString(curveString: string): Slip10Curve {
  switch (curveString) {
    case Slip10Curve.Ed25519:
      return Slip10Curve.Ed25519;
    case Slip10Curve.Secp256k1:
      return Slip10Curve.Secp256k1;
    default:
      throw new Error(`Unknown curve string: '${curveString}'`);
  }
}

export class Slip10RawIndex extends Uint32 {
  public static hardened(hardenedIndex: number): Slip10RawIndex {
    return new Slip10RawIndex(hardenedIndex + 2 ** 31);
  }

  public static normal(normalIndex: number): Slip10RawIndex {
    return new Slip10RawIndex(normalIndex);
  }

  public isHardened(): boolean {
    return this.data >= 2 ** 31;
  }
}

/**
 * An array of raw SLIP10 indices.
 *
 * This can be constructed via string parsing:
 *
 * ```ts
 * import { stringToPath } from "@cosmjs/crypto";
 *
 * const path = stringToPath("m/0'/1/2'/2/1000000000");
 * ```
 *
 * or manually:
 *
 * ```ts
 * import { HdPath, Slip10RawIndex } from "@cosmjs/crypto";
 *
 * // m/0'/1/2'/2/1000000000
 * const path: HdPath = [
 *   Slip10RawIndex.hardened(0),
 *   Slip10RawIndex.normal(1),
 *   Slip10RawIndex.hardened(2),
 *   Slip10RawIndex.normal(2),
 *   Slip10RawIndex.normal(1000000000),
 * ];
 * ```
 */
export type HdPath = readonly Slip10RawIndex[];

// Universal private key derivation accoring to
// https://github.com/satoshilabs/slips/blob/master/slip-0010.md
export class Slip10 {
  public static derivePath(curve: Slip10Curve, seed: Uint8Array, path: HdPath): Slip10Result {
    let result = this.master(curve, seed);
    for (const rawIndex of path) {
      result = this.child(curve, result.privkey, result.chainCode, rawIndex);
    }
    return result;
  }

  private static master(curve: Slip10Curve, seed: Uint8Array): Slip10Result {
    const i = new Hmac(Sha512, toAscii(curve)).update(seed).digest();
    const il = i.slice(0, 32);
    const ir = i.slice(32, 64);

    if (curve !== Slip10Curve.Ed25519 && (this.isZero(il) || this.isGteN(curve, il))) {
      return this.master(curve, i);
    }

    return {
      chainCode: ir,
      privkey: il,
    };
  }

  private static child(
    curve: Slip10Curve,
    parentPrivkey: Uint8Array,
    parentChainCode: Uint8Array,
    rawIndex: Slip10RawIndex,
  ): Slip10Result {
    let i: Uint8Array;
    if (rawIndex.isHardened()) {
      const payload = new Uint8Array([0x00, ...parentPrivkey, ...rawIndex.toBytesBigEndian()]);
      i = new Hmac(Sha512, parentChainCode).update(payload).digest();
    } else {
      if (curve === Slip10Curve.Ed25519) {
        throw new Error("Normal keys are not allowed with ed25519");
      } else {
        // Step 1 of https://github.com/satoshilabs/slips/blob/master/slip-0010.md#private-parent-key--private-child-key
        // Calculate I = HMAC-SHA512(Key = c_par, Data = ser_P(point(k_par)) || ser_32(i)).
        // where the functions point() and ser_p() are defined in BIP-0032
        const data = new Uint8Array([
          ...Slip10.serializedPoint(curve, fromBeBytes(parentPrivkey)),
          ...rawIndex.toBytesBigEndian(),
        ]);
        i = new Hmac(Sha512, parentChainCode).update(data).digest();
      }
    }

    return this.childImpl(curve, parentPrivkey, parentChainCode, rawIndex, i);
  }

  /**
   * Implementation of ser_P(point(k_par)) from BIP-0032
   *
   * @see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
   */
  private static serializedPoint(curve: Slip10Curve, p: bigint): Uint8Array {
    switch (curve) {
      case Slip10Curve.Secp256k1: {
        return secp256k1.Point.BASE.multiply(p).toRawBytes(true);
      }
      default:
        throw new Error("curve not supported");
    }
  }

  private static childImpl(
    curve: Slip10Curve,
    parentPrivkey: Uint8Array,
    parentChainCode: Uint8Array,
    rawIndex: Slip10RawIndex,
    i: Uint8Array,
  ): Slip10Result {
    // step 2 (of the Private parent key → private child key algorithm)

    const il = i.slice(0, 32);
    const ir = i.slice(32, 64);

    // step 3
    const returnChainCode = ir;

    // step 4
    if (curve === Slip10Curve.Ed25519) {
      return {
        chainCode: returnChainCode,
        privkey: il,
      };
    }

    // step 5
    const n = this.n(curve);
    const returnChildKeyAsNumber = new BN(il).add(new BN(parentPrivkey)).mod(n);
    const returnChildKey = Uint8Array.from(returnChildKeyAsNumber.toArray("be", 32));

    // step 6
    if (this.isGteN(curve, il) || this.isZero(returnChildKey)) {
      const newI = new Hmac(Sha512, parentChainCode)
        .update(new Uint8Array([0x01, ...ir, ...rawIndex.toBytesBigEndian()]))
        .digest();
      return this.childImpl(curve, parentPrivkey, parentChainCode, rawIndex, newI);
    }

    // step 7
    return {
      chainCode: returnChainCode,
      privkey: returnChildKey,
    };
  }

  private static isZero(privkey: Uint8Array): boolean {
    return privkey.every((byte) => byte === 0);
  }

  private static isGteN(curve: Slip10Curve, privkey: Uint8Array): boolean {
    const keyAsNumber = new BN(privkey);
    return keyAsNumber.gte(this.n(curve));
  }

  private static n(curve: Slip10Curve): BN {
    switch (curve) {
      case Slip10Curve.Secp256k1:
        return new BN("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", 16);
      default:
        throw new Error("curve not supported");
    }
  }
}

export function pathToString(path: HdPath): string {
  return path.reduce((current, component): string => {
    const componentString = component.isHardened()
      ? `${component.toNumber() - 2 ** 31}'`
      : component.toString();
    return current + "/" + componentString;
  }, "m");
}

export function stringToPath(input: string): HdPath {
  if (!input.startsWith("m")) throw new Error("Path string must start with 'm'");
  let rest = input.slice(1);

  const out = new Array<Slip10RawIndex>();
  while (rest) {
    const match = rest.match(/^\/([0-9]+)('?)/);
    if (!match) throw new Error("Syntax error while reading path component");
    const [fullMatch, numberString, apostrophe] = match;
    const value = Uint53.fromString(numberString).toNumber();
    if (value >= 2 ** 31) throw new Error("Component value too high. Must not exceed 2**31-1.");
    if (apostrophe) out.push(Slip10RawIndex.hardened(value));
    else out.push(Slip10RawIndex.normal(value));
    rest = rest.slice(fullMatch.length);
  }
  return out;
}
