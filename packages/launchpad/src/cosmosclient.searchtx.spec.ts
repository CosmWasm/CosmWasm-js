/* eslint-disable @typescript-eslint/naming-convention */
import { coins, makeSignDoc, makeStdTx, Secp256k1HdWallet } from "@cosmjs/amino";
import { assert, sleep } from "@cosmjs/utils";

import { CosmosClient, isBroadcastTxFailure } from "./cosmosclient";
import { LcdClient } from "./lcdapi";
import { isMsgSend, MsgSend } from "./msgs";
import { SigningCosmosClient } from "./signingcosmosclient";
import {
  faucet,
  fromOneElementArray,
  launchpad,
  launchpadEnabled,
  makeRandomAddress,
  pendingWithoutLaunchpad,
} from "./testutils.spec";
import { WrappedStdTx } from "./tx";

interface TestTxSend {
  readonly sender: string;
  readonly recipient: string;
  readonly hash: string;
  readonly height: number;
  readonly tx: WrappedStdTx;
}

describe("CosmosClient.getTx and .searchTx", () => {
  let sendUnsuccessful: TestTxSend | undefined;
  let sendSuccessful: TestTxSend | undefined;

  beforeAll(async () => {
    if (launchpadEnabled()) {
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const accounts = await wallet.getAccounts();
      const [{ address: walletAddress }] = accounts;
      const client = new SigningCosmosClient(launchpad.endpoint, faucet.address0, wallet);

      {
        const memo = "Sending more than I can afford";
        const recipient = makeRandomAddress();
        const amount = coins(123456700000000, "ucosm");
        const sendMsg: MsgSend = {
          type: "cosmos-sdk/MsgSend",
          value: {
            from_address: faucet.address0,
            to_address: recipient,
            amount: amount,
          },
        };
        const fee = {
          amount: coins(2000, "ucosm"),
          gas: "80000", // 80k
        };
        const { accountNumber, sequence } = await client.getSequence();
        const chainId = await client.getChainId();
        const signDoc = makeSignDoc([sendMsg], fee, chainId, memo, accountNumber, sequence);
        const { signed, signature } = await wallet.signAmino(walletAddress, signDoc);
        const tx: WrappedStdTx = {
          type: "cosmos-sdk/StdTx",
          value: makeStdTx(signed, signature),
        };
        const transactionId = await client.getIdentifier(tx);
        const result = await client.broadcastTx(tx.value);
        if (isBroadcastTxFailure(result)) {
          sendUnsuccessful = {
            sender: faucet.address0,
            recipient: recipient,
            hash: transactionId,
            height: result.height,
            tx: tx,
          };
        }
      }

      {
        const recipient = makeRandomAddress();
        const amount = coins(1234567, "ucosm");
        const result = await client.sendTokens(recipient, amount);
        await sleep(75); // wait until tx is indexed
        const txDetails = await new LcdClient(launchpad.endpoint).txById(result.transactionHash);
        sendSuccessful = {
          sender: faucet.address0,
          recipient: recipient,
          hash: result.transactionHash,
          height: Number.parseInt(txDetails.height, 10),
          tx: txDetails.tx,
        };
      }
    }
  });

  describe("getTx", () => {
    it("can get successful tx by ID", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const result = await client.getTx(sendSuccessful.hash);
      expect(result).toEqual(
        jasmine.objectContaining({
          height: sendSuccessful.height,
          hash: sendSuccessful.hash,
          code: 0,
          tx: sendSuccessful.tx,
        }),
      );
    });

    it("can get unsuccessful tx by ID", async () => {
      pendingWithoutLaunchpad();
      assert(sendUnsuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const result = await client.getTx(sendUnsuccessful.hash);
      expect(result).toEqual(
        jasmine.objectContaining({
          height: sendUnsuccessful.height,
          hash: sendUnsuccessful.hash,
          code: 5,
          tx: sendUnsuccessful.tx,
        }),
      );
    });

    it("can get by ID (non existent)", async () => {
      pendingWithoutLaunchpad();
      const client = new CosmosClient(launchpad.endpoint);
      const nonExistentId = "0000000000000000000000000000000000000000000000000000000000000000";
      const result = await client.getTx(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe("with SearchByHeightQuery", () => {
    it("can search successful tx by height", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const result = await client.searchTx({ height: sendSuccessful.height });
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContain(
        jasmine.objectContaining({
          height: sendSuccessful.height,
          hash: sendSuccessful.hash,
          code: 0,
          tx: sendSuccessful.tx,
        }),
      );
    });

    it("can search unsuccessful tx by height", async () => {
      pendingWithoutLaunchpad();
      assert(sendUnsuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const result = await client.searchTx({ height: sendUnsuccessful.height });
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContain(
        jasmine.objectContaining({
          height: sendUnsuccessful.height,
          hash: sendUnsuccessful.hash,
          code: 5,
          tx: sendUnsuccessful.tx,
        }),
      );
    });
  });

  describe("with SearchBySentFromOrToQuery", () => {
    it("can search by sender", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const results = await client.searchTx({ sentFromOrTo: sendSuccessful.sender });
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Check basic structure of all results
      for (const result of results) {
        const containsMsgWithSender = !!result.tx.value.msg.find(
          (msg) => isMsgSend(msg) && msg.value.from_address == sendSuccessful!.sender,
        );
        const containsMsgWithRecipient = !!result.tx.value.msg.find(
          (msg) => isMsgSend(msg) && msg.value.to_address === sendSuccessful!.sender,
        );
        expect(containsMsgWithSender || containsMsgWithRecipient).toEqual(true);
      }

      // Check details of most recent result
      expect(results[results.length - 1]).toEqual(
        jasmine.objectContaining({
          height: sendSuccessful.height,
          hash: sendSuccessful.hash,
          tx: sendSuccessful.tx,
        }),
      );
    });

    it("can search by recipient", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const results = await client.searchTx({ sentFromOrTo: sendSuccessful.recipient });
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Check basic structure of all results
      for (const result of results) {
        const msg = fromOneElementArray(result.tx.value.msg);
        assert(isMsgSend(msg), `${result.hash} (height ${result.height}) is not a bank send transaction`);
        expect(
          msg.value.to_address === sendSuccessful.recipient ||
            msg.value.from_address == sendSuccessful.recipient,
        ).toEqual(true);
      }

      // Check details of most recent result
      expect(results[results.length - 1]).toEqual(
        jasmine.objectContaining({
          height: sendSuccessful.height,
          hash: sendSuccessful.hash,
          tx: sendSuccessful.tx,
        }),
      );
    });

    it("can search by recipient and filter by minHeight", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful);
      const client = new CosmosClient(launchpad.endpoint);
      const query = { sentFromOrTo: sendSuccessful.recipient };

      {
        const result = await client.searchTx(query, { minHeight: 0 });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { minHeight: sendSuccessful.height - 1 });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { minHeight: sendSuccessful.height });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { minHeight: sendSuccessful.height + 1 });
        expect(result.length).toEqual(0);
      }
    });

    it("can search by recipient and filter by maxHeight", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful);
      const client = new CosmosClient(launchpad.endpoint);
      const query = { sentFromOrTo: sendSuccessful.recipient };

      {
        const result = await client.searchTx(query, { maxHeight: 9999999999999 });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { maxHeight: sendSuccessful.height + 1 });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { maxHeight: sendSuccessful.height });
        expect(result.length).toEqual(1);
      }

      {
        const result = await client.searchTx(query, { maxHeight: sendSuccessful.height - 1 });
        expect(result.length).toEqual(0);
      }
    });
  });

  describe("with SearchByTagsQuery", () => {
    it("can search by transfer.recipient", async () => {
      pendingWithoutLaunchpad();
      assert(sendSuccessful, "value must be set in beforeAll()");
      const client = new CosmosClient(launchpad.endpoint);
      const results = await client.searchTx({
        tags: [{ key: "transfer.recipient", value: sendSuccessful.recipient }],
      });
      expect(results.length).toBeGreaterThanOrEqual(1);

      // Check basic structure of all results
      for (const result of results) {
        const msg = fromOneElementArray(result.tx.value.msg);
        assert(isMsgSend(msg), `${result.hash} (height ${result.height}) is not a bank send transaction`);
        expect(msg.value.to_address).toEqual(sendSuccessful.recipient);
      }

      // Check details of most recent result
      expect(results[results.length - 1]).toEqual(
        jasmine.objectContaining({
          height: sendSuccessful.height,
          hash: sendSuccessful.hash,
          tx: sendSuccessful.tx,
        }),
      );
    });
  });
});
