import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";

import { QueryClient } from "../../queryclient";
import { pendingWithoutSimapp, simapp } from "../../testutils.spec";
import { MintExtension, setupMintExtension } from "./queries";

async function makeClientWithMint(rpcUrl: string): Promise<[QueryClient & MintExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupMintExtension), cometClient];
}

describe("MintExtension", () => {
  describe("params", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithMint(simapp.tendermintUrl);

      const params = await client.mint.params();
      expect(Number(params.blocksPerYear)).toBeGreaterThan(100_000);
      expect(Number(params.blocksPerYear)).toBeLessThan(100_000_000);
      expect(params.goalBonded.toString()).toEqual("0.67");
      expect(params.inflationMin.toString()).toEqual("0.07");
      expect(params.inflationMax.toString()).toEqual("0.2");
      expect(params.inflationRateChange.toString()).toEqual("0.13");
      expect(params.mintDenom).toEqual(simapp.denomStaking);

      cometClient.disconnect();
    });
  });

  describe("inflation", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithMint(simapp.tendermintUrl);

      const inflation = await client.mint.inflation();
      expect(inflation.toFloatApproximation()).toBeGreaterThan(0.13);
      expect(inflation.toFloatApproximation()).toBeLessThan(0.1301);

      cometClient.disconnect();
    });
  });

  describe("annualProvisions", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithMint(simapp.tendermintUrl);

      const annualProvisions = await client.mint.annualProvisions();
      expect(annualProvisions.toFloatApproximation()).toBeGreaterThan(5_400_000_000);
      expect(annualProvisions.toFloatApproximation()).toBeLessThan(5_500_000_000);

      cometClient.disconnect();
    });
  });
});
