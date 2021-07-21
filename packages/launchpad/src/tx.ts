import { isStdTx, StdTx } from "@cosmjs/amino";

/**
 * An Amino JSON wrapper around the Tx interface
 */
export interface WrappedTx {
  readonly type: string;
  readonly value: any;
}

/**
 * An Amino JSON wrapper around StdTx
 */
export interface WrappedStdTx extends WrappedTx {
  readonly type: "cosmos-sdk/StdTx";
  readonly value: StdTx;
}

export function isWrappedStdTx(wrapped: WrappedTx): wrapped is WrappedStdTx {
  return (wrapped as WrappedStdTx).type === "cosmos-sdk/StdTx" && isStdTx(wrapped.value);
}

/** @deprecated use WrappedStdTx */
export type CosmosSdkTx = WrappedStdTx;
