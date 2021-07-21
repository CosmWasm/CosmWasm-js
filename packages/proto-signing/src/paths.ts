import { HdPath, Slip10RawIndex } from "@cosmjs/crypto";

/**
 * The Cosmos Hub derivation path in the form `m/44'/118'/0'/0/a`
 * with 0-based account index `a`.
 */
export function makeCosmoshubPath(a: number): HdPath {
  return [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(118),
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(a),
  ];
}

/**
 * Creates a Cosmos path under the Cosmos purpose 7564153
 * in the form `m/7564153'/chain_index'/*`.
 */
export function makeCosmosPath(chainIndex: number, ...components: Slip10RawIndex[]): HdPath {
  const cosmosPurpose = 7564153;
  return [Slip10RawIndex.hardened(cosmosPurpose), Slip10RawIndex.hardened(chainIndex), ...components];
}

/**
 * Creates a Cosmos simple HD path in the form `m/7564153'/chain_index'/1'/a`
 * with a 0-based account index `a`.
 */
export function makeSimpleHdPath(chainIndex: number, a: number): HdPath {
  return makeCosmosPath(chainIndex, Slip10RawIndex.hardened(1), Slip10RawIndex.normal(a));
}
