/* eslint-disable @typescript-eslint/naming-convention */
import { makeSignDoc, makeStdTx, Secp256k1HdWallet, StdFee } from "@cosmjs/amino";
import { assert, sleep } from "@cosmjs/utils";
import { ReadonlyDate } from "readonly-date";

import { assertIsBroadcastTxSuccess, CosmosClient, PrivateCosmosClient } from "./cosmosclient";
import { findAttribute } from "./logs";
import { MsgSend } from "./msgs";
import cosmoshub from "./testdata/cosmoshub.json";
import {
  faucet,
  launchpad,
  makeRandomAddress,
  pendingWithoutLaunchpad,
  tendermintIdMatcher,
  unused,
} from "./testutils.spec";
import { isWrappedStdTx } from "./tx";

const blockTime = 1_000; // ms

const guest = {
  address: "cosmos17d0jcz59jf68g52vq38tuuncmwwjk42u6mcxej",
};

describe("CosmosClient", () => {
  describe("constructor", () => {
    it("can be constructed", () => {
      const client = new CosmosClient(launchpad.endpoint);
      expect(client).toBeTruthy();
    });
  });

  describe("getChainId", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      expect(await client.getChainId()).toEqual(launchpad.chainId);
    });

    it("caches chain ID", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const openedClient = client as unknown as PrivateCosmosClient;
      const getCodeSpy = spyOn(openedClient.lcdClient, "nodeInfo").and.callThrough();

      expect(await client.getChainId()).toEqual(launchpad.chainId); // from network
      expect(await client.getChainId()).toEqual(launchpad.chainId); // from cache

      expect(getCodeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("getHeight", () => {
    it("gets height via last block", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const openedClient = client as unknown as PrivateCosmosClient;
      const blockLatestSpy = spyOn(openedClient.lcdClient, "blocksLatest").and.callThrough();

      const height1 = await client.getHeight();
      expect(height1).toBeGreaterThan(0);
      await sleep(blockTime * 1.4); // tolerate chain being 40% slower than expected
      const height2 = await client.getHeight();
      expect(height2).toBeGreaterThanOrEqual(height1 + 1);
      expect(height2).toBeLessThanOrEqual(height1 + 2);

      expect(blockLatestSpy).toHaveBeenCalledTimes(2);
    });

    it("gets height via authAccount once an address is known", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);

      const openedClient = client as unknown as PrivateCosmosClient;
      const blockLatestSpy = spyOn(openedClient.lcdClient, "blocksLatest").and.callThrough();
      const authAccountsSpy = spyOn(openedClient.lcdClient.auth, "account").and.callThrough();

      const height1 = await client.getHeight();
      expect(height1).toBeGreaterThan(0);

      await client.getAccount(guest.address); // warm up the client

      const height2 = await client.getHeight();
      expect(height2).toBeGreaterThan(0);
      await sleep(blockTime * 1.3); // tolerate chain being 30% slower than expected
      const height3 = await client.getHeight();
      expect(height3).toBeGreaterThanOrEqual(height2 + 1);
      expect(height3).toBeLessThanOrEqual(height2 + 2);

      expect(blockLatestSpy).toHaveBeenCalledTimes(1);
      expect(authAccountsSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe("getSequence", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      expect(await client.getSequence(unused.address)).toEqual({
        accountNumber: unused.accountNumber,
        sequence: unused.sequence,
      });
    });

    it("throws for missing accounts", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const missing = makeRandomAddress();
      await client.getSequence(missing).then(
        () => fail("this must not succeed"),
        (error) => expect(error).toMatch(/account does not exist on chain/i),
      );
    });
  });

  describe("getAccount", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      expect(await client.getAccount(unused.address)).toEqual({
        address: unused.address,
        accountNumber: unused.accountNumber,
        sequence: unused.sequence,
        pubkey: undefined,
        balance: [
          { denom: "ucosm", amount: "1000000000" },
          { denom: "ustake", amount: "1000000000" },
        ],
      });
    });

    it("returns undefined for missing accounts", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const missing = makeRandomAddress();
      expect(await client.getAccount(missing)).toBeUndefined();
    });
  });

  describe("getBlock", () => {
    it("works for latest block", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const response = await client.getBlock();

      expect(response).toEqual(
        jasmine.objectContaining({
          id: jasmine.stringMatching(tendermintIdMatcher),
          header: jasmine.objectContaining({
            chainId: await client.getChainId(),
          }),
          txs: [],
        }),
      );

      expect(response.header.height).toBeGreaterThanOrEqual(1);
      expect(new ReadonlyDate(response.header.time).getTime()).toBeLessThan(ReadonlyDate.now());
      expect(new ReadonlyDate(response.header.time).getTime()).toBeGreaterThanOrEqual(
        ReadonlyDate.now() - 5_000,
      );
    });

    it("works for block by height", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const height = (await client.getBlock()).header.height;
      const response = await client.getBlock(height - 1);

      expect(response).toEqual(
        jasmine.objectContaining({
          id: jasmine.stringMatching(tendermintIdMatcher),
          header: jasmine.objectContaining({
            height: height - 1,
            chainId: await client.getChainId(),
          }),
          txs: [],
        }),
      );

      expect(new ReadonlyDate(response.header.time).getTime()).toBeLessThan(ReadonlyDate.now());
      expect(new ReadonlyDate(response.header.time).getTime()).toBeGreaterThanOrEqual(
        ReadonlyDate.now() - 5_000,
      );
    });
  });

  describe("getIdentifier", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      assert(isWrappedStdTx(cosmoshub.tx));
      expect(await client.getIdentifier(cosmoshub.tx)).toEqual(cosmoshub.id);
    });
  });

  describe("broadcastTx", () => {
    it("works", async () => {
      pendingWithoutLaunchpad();
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const accounts = await wallet.getAccounts();
      const [{ address: walletAddress }] = accounts;
      const client = new CosmosClient(launchpad.endpoint);

      const memo = "Test send";
      const sendMsg: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: faucet.address0,
          to_address: makeRandomAddress(),
          amount: [
            {
              denom: "ucosm",
              amount: "1234567",
            },
          ],
        },
      };

      const fee: StdFee = {
        amount: [
          {
            amount: "5000",
            denom: "ucosm",
          },
        ],
        gas: "890000",
      };

      const chainId = await client.getChainId();
      const { accountNumber, sequence } = await client.getSequence(faucet.address0);
      const signDoc = makeSignDoc([sendMsg], fee, chainId, memo, accountNumber, sequence);
      const { signed, signature } = await wallet.signAmino(walletAddress, signDoc);
      const signedTx = makeStdTx(signed, signature);
      const txResult = await client.broadcastTx(signedTx);
      assertIsBroadcastTxSuccess(txResult);
      const { logs, transactionHash } = txResult;
      const amountAttr = findAttribute(logs, "transfer", "amount");
      expect(amountAttr.value).toEqual("1234567ucosm");
      expect(transactionHash).toMatch(/^[0-9A-F]{64}$/);
    });
  });
});
