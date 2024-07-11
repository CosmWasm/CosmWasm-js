import { toBase64 } from "@cosmjs/encoding";
import { Decimal, Uint32 } from "@cosmjs/math";
import { DenomUnit } from "cosmjs-types/cosmos/bank/v1beta1/bank";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";

export type DisplayUnit = Pick<DenomUnit, "denom" | "exponent">;

export function formatInteger(input: string): string {
  return Decimal.fromAtomics(input, 0).toString(".", "'");
}

export function formatDecimal(input: string): string {
  const out = Decimal.fromUserInput(input, 18).toString(".", "'");
  return out;
}

export function formatCoin(input: Coin, unit: DisplayUnit): string {
  const out = Decimal.fromAtomics(input.amount, unit.exponent).toString(".", "'");
  return out + " " + unit.denom;
}

function compareAscii(a: string, b: string): number {
  if (a == b) return 0;
  else if (a < b) return -5;
  else return 5;
}

export function formatCoins(input: Coin[], units: Record<string, DisplayUnit>): string {
  // Pairs of value and display denom
  const pairs = input.map((coin): [string, string] => {
    const unit = units[coin.denom] as undefined | DisplayUnit;
    if (!unit) throw new Error(`Missing display unit information for denom '${coin.denom}'`);
    const [value, displayDenom] = formatCoin(coin, unit).split(" ");
    return [value, displayDenom];
  });
  pairs.sort((a, b) => compareAscii(a[1], b[1]));
  return pairs.map((pair) => pair.join(" ")).join(", ");
}

export function formatBytes(data: Uint8Array): string {
  return toBase64(data);
}

export interface DateWithNanoseconds extends Date {
  /** Nanoseconds after the time stored in a vanilla Date (millisecond granularity) */
  nanoseconds?: number;
}

function toRfc3339WithNanoseconds(dateTime: DateWithNanoseconds): string {
  const millisecondIso = dateTime.toISOString();
  const nanoseconds = dateTime.nanoseconds?.toString() ?? "";
  return `${millisecondIso.slice(0, -1)}${nanoseconds.padStart(6, "0")}Z`;
}

function fromSeconds(seconds: number, nanos = 0): DateWithNanoseconds {
  const checkedNanos = new Uint32(nanos).toNumber();
  if (checkedNanos > 999_999_999) {
    throw new Error("Nano seconds must not exceed 999999999");
  }
  const out: DateWithNanoseconds = new Date(seconds * 1000 + Math.floor(checkedNanos / 1000000));
  out.nanoseconds = checkedNanos % 1000000;
  return out;
}

export function formatTimestamp(seconds: number, nanos: number): string {
  return toRfc3339WithNanoseconds(fromSeconds(seconds, nanos));
}
