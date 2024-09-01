import axios from "axios";
import Koa from "koa";
import cors = require("@koa/cors");
import bodyParser from "koa-bodyparser";
import qs from "node:querystring";

import { isValidAddress } from "../addresses";
import * as constants from "../constants";
import { Faucet } from "../faucet";
import { HttpError } from "./httperror";
import { RequestParser } from "./requestparser";

/** This will be passed 1:1 to the user */
export interface ChainConstants {
  readonly nodeUrl: string;
  readonly chainId: string;
}

interface RecaptchaResponse {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  challenge_ts?: string;
  hostname?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "error-codes"?: string[];
}

export class Webserver {
  private readonly api = new Koa();
  private readonly addressCounter = new Map<string, Date>();

  public constructor(faucet: Faucet, chainConstants: ChainConstants) {
    this.api.use(cors());
    this.api.use(bodyParser());

    this.api.use(async (context) => {
      switch (context.path) {
        case "/":
        case "/healthz":
          context.response.body =
            "Welcome to the faucet!\n" +
            "\n" +
            "Check the full status via the /status endpoint.\n" +
            "You can get tokens from here by POSTing to /credit.\n" +
            "See https://github.com/cosmos/cosmjs/tree/main/packages/faucet for all further information.\n";
          break;
        case "/status": {
          const [holder, ...distributors] = await faucet.loadAccounts();
          const availableTokens = await faucet.availableTokens();
          const chainTokens = faucet.configuredTokens();
          context.response.body = {
            status: "ok",
            ...chainConstants,
            chainTokens: chainTokens,
            availableTokens: availableTokens,
            holder: holder,
            distributors: distributors,
          };
          break;
        }
        case "/credit": {
          if (context.request.method !== "POST") {
            throw new HttpError(405, "This endpoint requires a POST request");
          }

          if (context.request.type !== "application/json") {
            throw new HttpError(415, "Content-type application/json expected");
          }

          // context.request.body is set by the bodyParser() plugin
          const requestBody = (context.request as any).body;
          const creditBody = RequestParser.parseCreditBody(requestBody);
          const { address, denom, recaptcha } = creditBody;

          if (!isValidAddress(address, constants.addressPrefix)) {
            throw new HttpError(400, "Address is not in the expected format for this chain.");
          }

          const entry = this.addressCounter.get(address);
          if (entry !== undefined) {
            const cooldownTimeMs = constants.cooldownTime * 1000;
            if (entry.getTime() + cooldownTimeMs > Date.now()) {
              throw new HttpError(
                405,
                `Too many request for the same address. Blocked to prevent draining. Please wait ${constants.cooldownTime} seconds and try it again!`,
              );
            }
          }

          const availableTokens = await faucet.availableTokens();
          const matchingDenom = availableTokens.find((availableDenom) => availableDenom === denom);
          if (matchingDenom === undefined) {
            throw new HttpError(422, `Token is not available. Available tokens are: ${availableTokens}`);
          }

          // if enabled, require recaptcha validation
          if (process.env.GOOGLE_RECAPTCHA_SECRET_KEY !== undefined) {
            const response = await axios.post<RecaptchaResponse>(
              "https://www.google.com/recaptcha/api/siteverify",
              qs.stringify({
                secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
                response: recaptcha,
              }),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              },
            );

            const verifyData = response.data;
            if (!verifyData.success) {
              console.error(`recaptcha validation FAILED ${JSON.stringify(verifyData, null, 4)}`);
              throw new HttpError(423, `Recaptcha failed to verify`);
            }
          }

          try {
            // Count addresses to prevent draining
            this.addressCounter.set(address, new Date());
            await faucet.credit(address, matchingDenom);
          } catch (e) {
            console.error(e);
            throw new HttpError(500, "Sending tokens failed");
          }

          context.response.body = "ok";
          break;
        }
        default:
        // koa sends 404 by default
      }
    });
  }

  public start(port: number): void {
    console.info(`Starting webserver on port ${port} ...`);
    this.api.listen(port);
  }
}
