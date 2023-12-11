import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";

import { QueryClient } from "../../queryclient";
import {
  nonExistentAddress,
  nonNegativeIntegerMatcher,
  pendingWithoutSimapp,
  simapp,
  unused,
} from "../../testutils.spec";
import { BankExtension, setupBankExtension } from "./queries";

async function makeClientWithBank(rpcUrl: string): Promise<[QueryClient & BankExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupBankExtension), cometClient];
}

describe("BankExtension", () => {
  describe("balance", () => {
    it("works for different existing balances", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const response1 = await client.bank.balance(unused.address, simapp.denomFee);
      expect(response1).toEqual({
        amount: unused.balanceFee,
        denom: simapp.denomFee,
      });
      const response2 = await client.bank.balance(unused.address, simapp.denomStaking);
      expect(response2).toEqual({
        amount: unused.balanceStaking,
        denom: simapp.denomStaking,
      });

      cometClient.disconnect();
    });

    it("returns zero for non-existent balance", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const response = await client.bank.balance(unused.address, "gintonic");
      expect(response).toEqual({
        amount: "0",
        denom: "gintonic",
      });

      cometClient.disconnect();
    });

    it("returns zero for non-existent address", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const response = await client.bank.balance(nonExistentAddress, simapp.denomFee);
      expect(response).toEqual({
        amount: "0",
        denom: simapp.denomFee,
      });

      cometClient.disconnect();
    });
  });

  describe("allBalances", () => {
    it("returns all balances for unused account", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const balances = await client.bank.allBalances(unused.address);
      expect(balances).toEqual([
        {
          amount: unused.balanceFee,
          denom: simapp.denomFee,
        },
        {
          amount: unused.balanceStaking,
          denom: simapp.denomStaking,
        },
      ]);

      cometClient.disconnect();
    });

    it("returns an empty list for non-existent account", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const balances = await client.bank.allBalances(nonExistentAddress);
      expect(balances).toEqual([]);

      cometClient.disconnect();
    });
  });

  describe("totalSupply", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const { supply } = await client.bank.totalSupply();
      expect(supply).toEqual([
        {
          amount: simapp.totalSupply.toString(),
          denom: simapp.denomFee,
        },
        {
          amount: jasmine.stringMatching(nonNegativeIntegerMatcher),
          denom: simapp.denomStaking,
        },
      ]);

      cometClient.disconnect();
    });
  });

  describe("supplyOf", () => {
    it("works for existing denom", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const response = await client.bank.supplyOf(simapp.denomFee);
      expect(response).toEqual({
        amount: simapp.totalSupply.toString(),
        denom: simapp.denomFee,
      });

      cometClient.disconnect();
    });

    it("returns zero for non-existent denom", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const response = await client.bank.supplyOf("gintonic");
      expect(response).toEqual({
        amount: "0",
        denom: "gintonic",
      });

      cometClient.disconnect();
    });
  });

  describe("denomMetadata", () => {
    it("works for existent denom", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const metadata = await client.bank.denomMetadata("ucosm");
      expect(metadata).toEqual(
        jasmine.objectContaining({
          description: "The fee token of this test chain",
          denomUnits: [
            {
              denom: "ucosm",
              exponent: 0,
              aliases: [],
            },
            {
              denom: "COSM",
              exponent: 6,
              aliases: [],
            },
          ],
          base: "ucosm",
          display: "COSM",
          name: "",
          symbol: "",
        }),
      );

      cometClient.disconnect();
    });

    it("works for non-existent denom", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      await expectAsync(client.bank.denomMetadata("nothere")).toBeRejectedWithError(/code = NotFound/i);

      cometClient.disconnect();
    });
  });

  describe("denomsMetadata", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithBank(simapp.tendermintUrl);

      const metadatas = await client.bank.denomsMetadata();
      expect(metadatas.length).toEqual(1);
      expect(metadatas[0]).toEqual(
        jasmine.objectContaining({
          description: "The fee token of this test chain",
          denomUnits: [
            {
              denom: "ucosm",
              exponent: 0,
              aliases: [],
            },
            {
              denom: "COSM",
              exponent: 6,
              aliases: [],
            },
          ],
          base: "ucosm",
          display: "COSM",
          name: "",
          symbol: "",
        }),
      );

      cometClient.disconnect();
    });
  });
});
