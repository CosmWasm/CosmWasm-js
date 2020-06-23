import { HttpError } from "./httperror";

export interface CreditRequestBodyData {
  /** The ticker symbol */
  readonly ticker: string;
  /** The recipient address */
  readonly address: string;
}

export class RequestParser {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static parseCreditBody(body: any): CreditRequestBodyData {
    const { address, ticker } = body;

    if (typeof address !== "string") {
      throw new HttpError(400, "Property 'address' must be a string.");
    }

    if (address.length === 0) {
      throw new HttpError(400, "Property 'address' must not be empty.");
    }

    if (typeof ticker !== "string") {
      throw new HttpError(400, "Property 'ticker' must be a string");
    }

    if (ticker.length === 0) {
      throw new HttpError(400, "Property 'ticker' must not be empty.");
    }

    return {
      address: address,
      ticker: ticker,
    };
  }
}
