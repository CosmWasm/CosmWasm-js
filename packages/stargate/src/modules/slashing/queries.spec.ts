/* eslint-disable @typescript-eslint/naming-convention */
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";

import { QueryClient } from "../../queryclient";
import { pendingWithoutSimapp, simapp } from "../../testutils.spec";
import { setupSlashingExtension, SlashingExtension } from "./queries";

async function makeClientWithSlashing(
  rpcUrl: string,
): Promise<[QueryClient & SlashingExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupSlashingExtension), cometClient];
}

describe("SlashingExtension", () => {
  describe("signingInfos", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithSlashing(simapp.tendermintUrl);

      const response = await client.slashing.signingInfos();
      expect(response.info).toBeDefined();
      expect(response.info).not.toBeNull();

      cometClient.disconnect();
    });
  });

  describe("params", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithSlashing(simapp.tendermintUrl);

      const response = await client.slashing.params();
      expect(response.params).toBeDefined();
      expect(response.params).not.toBeNull();

      cometClient.disconnect();
    });
  });
});
