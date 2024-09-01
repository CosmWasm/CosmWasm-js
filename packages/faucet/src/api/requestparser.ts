import { isNonNullObject } from "@cosmjs/utils";

import { HttpError } from "./httperror";

export interface CreditRequestBodyData {
  /** The base denomination */
  readonly denom: string;
  /** The recipient address */
  readonly address: string;
  /** The recaptcha v2 response */
  readonly recaptcha: string | undefined;
}

export interface CreditRequestBodyDataWithTicker {
  /** The ticker symbol */
  readonly ticker: string;
  /** The recipient address */
  readonly address: string;
}

export class RequestParser {
  public static parseCreditBody(body: unknown): CreditRequestBodyData {
    if (!isNonNullObject(body) || Array.isArray(body)) {
      throw new HttpError(400, "Request body must be a dictionary.");
    }

    const { address, denom, ticker, recaptcha } = body as any;

    if (typeof ticker !== "undefined") {
      throw new HttpError(400, "The 'ticker' field was removed in CosmJS 0.23. Please use 'denom' instead.");
    }

    if (typeof address !== "string") {
      throw new HttpError(400, "Property 'address' must be a string.");
    }

    if (address.length === 0) {
      throw new HttpError(400, "Property 'address' must not be empty.");
    }

    if (typeof denom !== "string") {
      throw new HttpError(400, "Property 'denom' must be a string.");
    }

    if (denom.length === 0) {
      throw new HttpError(400, "Property 'denom' must not be empty.");
    }

    return {
      address: address,
      denom: denom,
      recaptcha: recaptcha,
    };
  }
}
