import { toAscii } from "@cosmjs/encoding";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";

import bytesData from "../testdata/bytes.json";
import coinData from "../testdata/coin.json";
import coinsData from "../testdata/coins.json";
import decimals from "../testdata/decimals.json";
import integers from "../testdata/integers.json";
import timestampData from "../testdata/timestamp.json";
import {
  DisplayUnit,
  formatBytes,
  formatCoin,
  formatCoins,
  formatDecimal,
  formatInteger,
  formatTimestamp,
} from "./valuerenderers";

type TestDataCoin = Array<[Coin, DisplayUnit, string]>;
type TestDataCoins = Array<[Coin[], Record<string, DisplayUnit>, string]>;
/** First argument is an array of bytes (0-255), second argument is the expected string */
type TestDataBytes = Array<[number[], string]>;
/** First argument is seconds, second argument is nanor and third argument is the expected string or null on error */
type TestDataTimestamp = Array<[number, number, string | null]>;

describe("valuerenderers", () => {
  describe("formatInteger", () => {
    it("works", () => {
      expect(formatInteger("1")).toEqual("1");
      expect(formatInteger("12")).toEqual("12");
      expect(formatInteger("123")).toEqual("123");
      expect(formatInteger("1234")).toEqual("1'234");
      expect(formatInteger("12345")).toEqual("12'345");
      expect(formatInteger("123456")).toEqual("123'456");
      expect(formatInteger("1234567")).toEqual("1'234'567");

      for (const [input, expected] of integers) {
        expect(formatInteger(input)).withContext(`Input '${input}'`).toEqual(expected);
      }
    });
  });

  describe("formatDecimal", () => {
    it("works", () => {
      expect(formatDecimal("1234.5678")).toEqual("1'234.5678");

      for (const [input, expected] of decimals) {
        expect(formatDecimal(input)).withContext(`Input '${input}'`).toEqual(expected);
      }
    });
  });

  describe("formatCoin", () => {
    it("works", () => {
      expect(formatCoin({ amount: "1", denom: "ucosm" }, { denom: "COSM", exponent: 6 })).toEqual(
        "0.000001 COSM",
      );

      for (const [coin, unit, expected] of coinData as TestDataCoin) {
        expect(formatCoin(coin, unit))
          .withContext(`Input '${JSON.stringify(coin)}'`)
          .toEqual(expected);
      }
    });
  });

  describe("formatCoins", () => {
    it("works", () => {
      const coin1 = { amount: "1", denom: "ucosm" };
      const coin2 = { amount: "3", denom: "ustake" };
      const displayMap: Record<string, DisplayUnit> = {
        ucosm: { denom: "COSM", exponent: 6 },
        ustake: { denom: "STAKE", exponent: 6 },
      };
      expect(formatCoins([coin1, coin2], displayMap)).toEqual("0.000001 COSM, 0.000003 STAKE");

      for (const [coins, units, expected] of coinsData as TestDataCoins) {
        expect(formatCoins(coins, units))
          .withContext(`Input '${JSON.stringify(coins)}'`)
          .toEqual(expected);
      }
    });
  });

  describe("formatBytes", () => {
    it("works", () => {
      expect(formatBytes(toAscii("foo"))).toEqual("Zm9v");

      for (const [data, expected] of bytesData as TestDataBytes) {
        expect(formatBytes(Uint8Array.from(data)))
          .withContext(`Input '${JSON.stringify(data)}'`)
          .toEqual(expected);
      }
    });
  });

  describe("formatTimestamp", () => {
    it("works", () => {
      expect(formatTimestamp(0, 0)).toEqual("1970-01-01T00:00:00.000000000Z");
      expect(formatTimestamp(0, 1)).toEqual("1970-01-01T00:00:00.000000001Z");
      expect(formatTimestamp(1, 2)).toEqual("1970-01-01T00:00:01.000000002Z");
      expect(formatTimestamp(5, 0)).toEqual("1970-01-01T00:00:05.000000000Z");

      for (const [seconds, nanos, expected] of timestampData as TestDataTimestamp) {
        if (expected === null) {
          expect(() => formatTimestamp(seconds, nanos))
            .withContext(`Input seconds=${seconds}, nanos=${nanos}`)
            .toThrowError();
        } else {
          expect(formatTimestamp(seconds, nanos))
            .withContext(`Input seconds=${seconds}, nanos=${nanos}`)
            .toEqual(expected);
        }
      }
    });
  });
});
