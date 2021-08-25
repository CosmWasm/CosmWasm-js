import { Sha256, sha256 } from "@cosmjs/crypto";
import { Bech32, toUtf8 } from "@cosmjs/encoding";

/**
 * Creates a basic address according to [ADR-028].
 *
 * This is called `Hash` in the document.
 *
 * [ADR-028]: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-028-public-key-addresses.md
 */
export function basicAddressRaw(type: string, key: Uint8Array): Uint8Array {
  const innerHash = sha256(toUtf8(type));
  const outerHash = new Sha256(innerHash).update(key).digest();
  // `A_LEN` is 32 and `hash` is sha256 so we avoid all the truncation clutter.
  return outerHash;
}

/**
 * Creates a raw (i.e. binary) module address accoding to [ADR-028].
 *
 * [ADR-028]: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-028-public-key-addresses.md
 */
export function moduleAddressRaw(moduleName: string, key: Uint8Array): Uint8Array {
  return basicAddressRaw("module", new Uint8Array([...toUtf8(moduleName), 0x00, ...key]));
}

/**
 * Creates a bech32 encoded module address accoding to [ADR-028].
 *
 * [ADR-028]: https://github.com/cosmos/cosmos-sdk/blob/master/docs/architecture/adr-028-public-key-addresses.md
 */
export function moduleAddress(moduleName: string, key: Uint8Array, prefix: string): string {
  return Bech32.encode(prefix, moduleAddressRaw(moduleName, key));
}
