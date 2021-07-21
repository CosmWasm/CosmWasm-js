import { Slip10RawIndex } from "@cosmjs/crypto";

import { makeCosmoshubPath, makeCosmosPath, makeSimpleHdPath } from "./paths";

describe("paths", () => {
  describe("makeCosmoshubPath", () => {
    it("works", () => {
      // m/44'/118'/0'/0/0
      expect(makeCosmoshubPath(0)).toEqual([
        Slip10RawIndex.hardened(44),
        Slip10RawIndex.hardened(118),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.normal(0),
        Slip10RawIndex.normal(0),
      ]);
      // m/44'/118'/0'/0/123
      expect(makeCosmoshubPath(123)).toEqual([
        Slip10RawIndex.hardened(44),
        Slip10RawIndex.hardened(118),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.normal(0),
        Slip10RawIndex.normal(123),
      ]);
    });
  });

  describe("makeCosmosPath", () => {
    it("works with all unhardened sub-trees on the testing chain", () => {
      // m/7564153'/0'
      expect(makeCosmosPath(0)).toEqual([Slip10RawIndex.hardened(7564153), Slip10RawIndex.hardened(0)]);
      // m/7564153'/0'/7
      expect(makeCosmosPath(0, Slip10RawIndex.normal(7))).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.normal(7),
      ]);
      // m/7564153'/0'/7/7/7
      expect(
        makeCosmosPath(0, Slip10RawIndex.normal(7), Slip10RawIndex.normal(7), Slip10RawIndex.normal(7)),
      ).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.normal(7),
        Slip10RawIndex.normal(7),
        Slip10RawIndex.normal(7),
      ]);
    });

    it("works with all hardened sub-trees on the testing chain", () => {
      // m/7564153'/0'
      expect(makeCosmosPath(0)).toEqual([Slip10RawIndex.hardened(7564153), Slip10RawIndex.hardened(0)]);
      // m/7564153'/0'/7'
      expect(makeCosmosPath(0, Slip10RawIndex.hardened(7))).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(7),
      ]);
      // m/7564153'/0'/7'/7'/7'
      expect(
        makeCosmosPath(0, Slip10RawIndex.hardened(7), Slip10RawIndex.hardened(7), Slip10RawIndex.hardened(7)),
      ).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(7),
        Slip10RawIndex.hardened(7),
        Slip10RawIndex.hardened(7),
      ]);
    });

    it("works with hardened/unhardened sub-tree on the testing chain", () => {
      // m/7564153'/0'/7'/7'/7'
      expect(
        makeCosmosPath(0, Slip10RawIndex.hardened(2), Slip10RawIndex.normal(3), Slip10RawIndex.hardened(4)),
      ).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(2),
        Slip10RawIndex.normal(3),
        Slip10RawIndex.hardened(4),
      ]);
    });
  });

  describe("makeSimpleHdPath", () => {
    it("works for account on the testing chain", () => {
      // m/7564153'/0'/1'/0
      expect(makeSimpleHdPath(0, 0)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(0),
      ]);
      // m/7564153'/0'/1'/1
      expect(makeSimpleHdPath(0, 1)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(1),
      ]);
      // m/7564153'/0'/1'/75000000
      expect(makeSimpleHdPath(0, 75_000_000)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(75_000_000),
      ]);
    });

    it("works for account 0 on different chains", () => {
      // m/7564153'/0'/1'/0
      expect(makeSimpleHdPath(0, 0)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(0),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(0),
      ]);
      // m/7564153'/1'/1'/0
      expect(makeSimpleHdPath(1, 0)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(0),
      ]);
      // m/7564153'/42'/1'/0
      expect(makeSimpleHdPath(42, 0)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(42),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(0),
      ]);
      // m/7564153'/42000000'/1'/0
      expect(makeSimpleHdPath(42_000_000, 0)).toEqual([
        Slip10RawIndex.hardened(7564153),
        Slip10RawIndex.hardened(42_000_000),
        Slip10RawIndex.hardened(1),
        Slip10RawIndex.normal(0),
      ]);
    });
  });
});
