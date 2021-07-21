/* eslint-disable @typescript-eslint/naming-convention */
import {
  Coin,
  coins,
  makeCosmoshubPath,
  makeSignDoc,
  makeStdTx,
  Secp256k1HdWallet,
  StdFee,
  StdTx,
} from "@cosmjs/amino";
import { assert, sleep } from "@cosmjs/utils";

import { isBroadcastTxFailure } from "../cosmosclient";
import { parseLogs } from "../logs";
import { MsgSend } from "../msgs";
import { SigningCosmosClient } from "../signingcosmosclient";
import cosmoshub from "../testdata/cosmoshub.json";
import {
  faucet,
  launchpad,
  launchpadEnabled,
  makeRandomAddress,
  nonNegativeIntegerMatcher,
  pendingWithoutLaunchpad,
  tendermintIdMatcher,
  unused,
} from "../testutils.spec";
import { isWrappedStdTx } from "../tx";
import { setupAuthExtension } from "./auth";
import { TxsResponse } from "./base";
import { LcdApiArray, LcdClient } from "./lcdclient";

describe("LcdClient", () => {
  const defaultRecipientAddress = makeRandomAddress();

  it("can be constructed", () => {
    const client = new LcdClient(launchpad.endpoint);
    expect(client).toBeTruthy();
  });

  describe("withModules", () => {
    interface TotalSupplyAllResponse {
      readonly height: string;
      readonly result: LcdApiArray<Coin>;
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    function setupSupplyExtension(base: LcdClient) {
      return {
        supply: {
          totalAll: async (): Promise<TotalSupplyAllResponse> => {
            return base.get(`/supply/total`);
          },
        },
      };
    }

    interface BankBalancesResponse {
      readonly height: string;
      readonly result: readonly Coin[];
    }

    interface BankExtension {
      readonly bank: {
        readonly balances: (address: string) => Promise<BankBalancesResponse>;
      };
    }

    function setupBankExtension(base: LcdClient): BankExtension {
      return {
        bank: {
          balances: async (address: string) => {
            const path = `/bank/balances/${address}`;
            return base.get(path);
          },
        },
      };
    }

    it("works for no extension", async () => {
      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint });
      expect(client).toBeTruthy();
    });

    it("works for one extension", async () => {
      pendingWithoutLaunchpad();

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupSupplyExtension);
      const supply = await client.supply.totalAll();
      expect(supply).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          {
            amount: jasmine.stringMatching(nonNegativeIntegerMatcher),
            denom: "ucosm",
          },
          {
            amount: jasmine.stringMatching(nonNegativeIntegerMatcher),
            denom: "ustake",
          },
        ],
      });
    });

    it("works for two extensions", async () => {
      pendingWithoutLaunchpad();

      const client = LcdClient.withExtensions(
        { apiUrl: launchpad.endpoint },
        setupSupplyExtension,
        setupBankExtension,
      );
      const supply = await client.supply.totalAll();
      expect(supply).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          {
            amount: jasmine.stringMatching(nonNegativeIntegerMatcher),
            denom: "ucosm",
          },
          {
            amount: jasmine.stringMatching(nonNegativeIntegerMatcher),
            denom: "ustake",
          },
        ],
      });
      const balances = await client.bank.balances(unused.address);
      expect(balances).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        result: [
          {
            denom: "ucosm",
            amount: "1000000000",
          },
          {
            denom: "ustake",
            amount: "1000000000",
          },
        ],
      });
    });

    it("can merge two extensions into the same module", async () => {
      pendingWithoutLaunchpad();

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      function setupSupplyExtensionBasic(base: LcdClient) {
        return {
          supply: {
            totalAll: async () => {
              const path = `/supply/total`;
              return base.get(path);
            },
          },
        };
      }

      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      function setupSupplyExtensionPremium(base: LcdClient) {
        return {
          supply: {
            total: async (denom: string) => {
              return base.get(`/supply/total/${denom}`);
            },
          },
        };
      }

      const client = LcdClient.withExtensions(
        { apiUrl: launchpad.endpoint },
        setupSupplyExtensionBasic,
        setupSupplyExtensionPremium,
      );
      expect(client.supply.totalAll).toEqual(jasmine.any(Function));
      expect(client.supply.total).toEqual(jasmine.any(Function));
    });
  });

  // The /txs endpoints

  describe("txById", () => {
    let successful:
      | {
          readonly sender: string;
          readonly recipient: string;
          readonly hash: string;
        }
      | undefined;
    let unsuccessful:
      | {
          readonly sender: string;
          readonly recipient: string;
          readonly hash: string;
        }
      | undefined;

    beforeAll(async () => {
      if (launchpadEnabled()) {
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const accounts = await wallet.getAccounts();
        const [{ address: walletAddress }] = accounts;
        const client = new SigningCosmosClient(launchpad.endpoint, faucet.address0, wallet);

        {
          const recipient = makeRandomAddress();
          const amount = coins(1234567, "ucosm");
          const result = await client.sendTokens(recipient, amount);
          successful = {
            sender: faucet.address0,
            recipient: recipient,
            hash: result.transactionHash,
          };
        }

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
          const signedTx = makeStdTx(signed, signature);
          const transactionId = await client.getIdentifier({ type: "cosmos-sdk/StdTx", value: signedTx });
          const result = await client.broadcastTx(signedTx);
          assert(isBroadcastTxFailure(result));
          unsuccessful = {
            sender: faucet.address0,
            recipient: recipient,
            hash: transactionId,
          };
        }

        await sleep(75); // wait until transactions are indexed
      }
    });

    it("works for successful transaction", async () => {
      pendingWithoutLaunchpad();
      assert(successful);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txById(successful.hash);
      expect(result.height).toBeGreaterThanOrEqual(1);
      expect(result.txhash).toEqual(successful.hash);
      expect(result.codespace).toBeUndefined();
      expect(result.code).toBeUndefined();
      const logs = parseLogs(result.logs);
      expect(logs).toEqual([
        {
          msg_index: 0,
          log: "",
          events: [
            {
              type: "message",
              attributes: [
                { key: "action", value: "send" },
                { key: "sender", value: successful.sender },
                { key: "module", value: "bank" },
              ],
            },
            {
              type: "transfer",
              attributes: [
                { key: "recipient", value: successful.recipient },
                { key: "sender", value: successful.sender },
                { key: "amount", value: "1234567ucosm" },
              ],
            },
          ],
        },
      ]);
    });

    it("works for unsuccessful transaction", async () => {
      pendingWithoutLaunchpad();
      assert(unsuccessful);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txById(unsuccessful.hash);
      expect(result.height).toBeGreaterThanOrEqual(1);
      expect(result.txhash).toEqual(unsuccessful.hash);
      expect(result.codespace).toEqual("sdk");
      expect(result.code).toEqual(5);
      expect(result.logs).toBeUndefined();
      expect(result.raw_log).toContain("insufficient funds");
    });
  });

  describe("txsQuery", () => {
    let broadcasted:
      | {
          readonly sender: string;
          readonly recipient: string;
          readonly hash: string;
          readonly height: number;
          readonly tx: TxsResponse;
        }
      | undefined;

    beforeAll(async () => {
      if (launchpadEnabled()) {
        const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
        const client = new SigningCosmosClient(launchpad.endpoint, faucet.address0, wallet);

        const recipient = makeRandomAddress();
        const amount = coins(1234567, "ucosm");
        const result = await client.sendTokens(recipient, amount);

        await sleep(75); // wait until tx is indexed
        const txDetails = await new LcdClient(launchpad.endpoint).txById(result.transactionHash);
        broadcasted = {
          sender: faucet.address0,
          recipient: recipient,
          hash: result.transactionHash,
          height: Number.parseInt(txDetails.height, 10),
          tx: txDetails,
        };
      }
    });

    it("can query transactions by height", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txsQuery(`tx.height=${broadcasted.height}&limit=26`);
      expect(result).toEqual({
        count: jasmine.stringMatching(/^(1|2|3|4|5)$/), // 1-5 transactions as string
        limit: "26",
        page_number: "1",
        page_total: "1",
        total_count: jasmine.stringMatching(/^(1|2|3|4|5)$/), // 1-5 transactions as string
        txs: jasmine.arrayContaining([broadcasted.tx]),
      });
    });

    it("can query transactions by ID", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txsQuery(`tx.hash=${broadcasted.hash}&limit=26`);
      expect(result).toEqual({
        count: "1",
        limit: "26",
        page_number: "1",
        page_total: "1",
        total_count: "1",
        txs: [broadcasted.tx],
      });
    });

    it("can query transactions by sender", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txsQuery(`message.sender=${broadcasted.sender}&limit=200`);
      expect(parseInt(result.count, 10)).toBeGreaterThanOrEqual(1);
      expect(parseInt(result.limit, 10)).toEqual(200);
      expect(parseInt(result.page_number, 10)).toEqual(1);
      expect(parseInt(result.page_total, 10)).toEqual(1);
      expect(parseInt(result.total_count, 10)).toBeGreaterThanOrEqual(1);
      expect(result.txs.length).toBeGreaterThanOrEqual(1);
      expect(result.txs[result.txs.length - 1]).toEqual(broadcasted.tx);
    });

    it("can query transactions by recipient", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const result = await client.txsQuery(`transfer.recipient=${broadcasted.recipient}&limit=200`);
      expect(parseInt(result.count, 10)).toEqual(1);
      expect(parseInt(result.limit, 10)).toEqual(200);
      expect(parseInt(result.page_number, 10)).toEqual(1);
      expect(parseInt(result.page_total, 10)).toEqual(1);
      expect(parseInt(result.total_count, 10)).toEqual(1);
      expect(result.txs.length).toBeGreaterThanOrEqual(1);
      expect(result.txs[result.txs.length - 1]).toEqual(broadcasted.tx);
    });

    it("can filter by tx.hash and tx.minheight", async () => {
      pending("This combination is broken 🤷‍♂️. Handle client-side at higher level.");
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const hashQuery = `tx.hash=${broadcasted.hash}`;

      {
        const { count } = await client.txsQuery(`${hashQuery}&tx.minheight=0`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${hashQuery}&tx.minheight=${broadcasted.height - 1}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${hashQuery}&tx.minheight=${broadcasted.height}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${hashQuery}&tx.minheight=${broadcasted.height + 1}`);
        expect(count).toEqual("0");
      }
    });

    it("can filter by recipient and tx.minheight", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const recipientQuery = `transfer.recipient=${broadcasted.recipient}`;

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.minheight=0`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.minheight=${broadcasted.height - 1}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.minheight=${broadcasted.height}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.minheight=${broadcasted.height + 1}`);
        expect(count).toEqual("0");
      }
    });

    it("can filter by recipient and tx.maxheight", async () => {
      pendingWithoutLaunchpad();
      assert(broadcasted);
      const client = new LcdClient(launchpad.endpoint);
      const recipientQuery = `transfer.recipient=${broadcasted.recipient}`;

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.maxheight=9999999999999`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.maxheight=${broadcasted.height + 1}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.maxheight=${broadcasted.height}`);
        expect(count).toEqual("1");
      }

      {
        const { count } = await client.txsQuery(`${recipientQuery}&tx.maxheight=${broadcasted.height - 1}`);
        expect(count).toEqual("0");
      }
    });
  });

  describe("encodeTx", () => {
    it("works for cosmoshub example", async () => {
      pendingWithoutLaunchpad();
      const client = new LcdClient(launchpad.endpoint);
      assert(isWrappedStdTx(cosmoshub.tx));
      const response = await client.encodeTx(cosmoshub.tx);
      expect(response).toEqual(
        jasmine.objectContaining({
          tx: cosmoshub.tx_data,
        }),
      );
    });
  });

  describe("broadcastTx", () => {
    it("can send tokens", async () => {
      pendingWithoutLaunchpad();
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const accounts = await wallet.getAccounts();
      const [{ address: walletAddress }] = accounts;

      const memo = "My first contract on chain";
      const theMsg: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: faucet.address0,
          to_address: defaultRecipientAddress,
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number, sequence } = (await client.auth.account(faucet.address0)).result.value;

      const signDoc = makeSignDoc([theMsg], fee, launchpad.chainId, memo, account_number, sequence);
      const { signed, signature } = await wallet.signAmino(walletAddress, signDoc);
      const signedTx = makeStdTx(signed, signature);
      const result = await client.broadcastTx(signedTx);
      expect(result.code).toBeUndefined();
      expect(result).toEqual({
        height: jasmine.stringMatching(nonNegativeIntegerMatcher),
        txhash: jasmine.stringMatching(tendermintIdMatcher),
        // code is not set
        raw_log: jasmine.stringMatching(/^\[.+\]$/i),
        logs: jasmine.any(Array),
        gas_wanted: jasmine.stringMatching(nonNegativeIntegerMatcher),
        gas_used: jasmine.stringMatching(nonNegativeIntegerMatcher),
      });
    });

    it("can't send transaction with additional signatures", async () => {
      pendingWithoutLaunchpad();
      const account1 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(0)],
      });
      const account2 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(1)],
      });
      const account3 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(2)],
      });
      const [address1, address2, address3] = await Promise.all(
        [account1, account2, account3].map(async (wallet) => {
          return (await wallet.getAccounts())[0].address;
        }),
      );

      const memo = "My first contract on chain";
      const theMsg: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address1,
          to_address: defaultRecipientAddress,
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number: an1, sequence: sequence1 } = (await client.auth.account(address1)).result.value;
      const { account_number: an2, sequence: sequence2 } = (await client.auth.account(address2)).result.value;
      const { account_number: an3, sequence: sequence3 } = (await client.auth.account(address3)).result.value;

      const signDoc1 = makeSignDoc([theMsg], fee, launchpad.chainId, memo, an1, sequence1);
      const signDoc2 = makeSignDoc([theMsg], fee, launchpad.chainId, memo, an2, sequence2);
      const signDoc3 = makeSignDoc([theMsg], fee, launchpad.chainId, memo, an3, sequence3);
      const { signature: signature1 } = await account1.signAmino(address1, signDoc1);
      const { signature: signature2 } = await account2.signAmino(address2, signDoc2);
      const { signature: signature3 } = await account3.signAmino(address3, signDoc3);
      const signedTx: StdTx = {
        msg: [theMsg],
        fee: fee,
        memo: memo,
        signatures: [signature1, signature2, signature3],
      };
      const broadcastResult = await client.broadcastTx(signedTx);
      expect(broadcastResult.code).toEqual(4);
      expect(broadcastResult.raw_log).toContain("wrong number of signers");
    });

    it("can send multiple messages with one signature", async () => {
      pendingWithoutLaunchpad();
      const wallet = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic);
      const accounts = await wallet.getAccounts();
      const [{ address: walletAddress }] = accounts;

      const memo = "My first contract on chain";
      const msg1: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: walletAddress,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "1234567",
            },
          ],
        },
      };
      const msg2: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: walletAddress,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "7654321",
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number, sequence } = (await client.auth.account(walletAddress)).result.value;

      const signDoc = makeSignDoc([msg1, msg2], fee, launchpad.chainId, memo, account_number, sequence);
      const { signed, signature } = await wallet.signAmino(walletAddress, signDoc);
      const signedTx = makeStdTx(signed, signature);
      const broadcastResult = await client.broadcastTx(signedTx);
      expect(broadcastResult.code).toBeUndefined();
    });

    it("can send multiple messages with multiple signatures", async () => {
      pendingWithoutLaunchpad();
      const account1 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(0)],
      });
      const account2 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(1)],
      });
      const [address1, address2] = await Promise.all(
        [account1, account2].map(async (wallet) => {
          return (await wallet.getAccounts())[0].address;
        }),
      );

      const memo = "My first contract on chain";
      const msg1: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address1,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "1234567",
            },
          ],
        },
      };
      const msg2: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address2,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "7654321",
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number: an1, sequence: sequence1 } = (await client.auth.account(address1)).result.value;
      const { account_number: an2, sequence: sequence2 } = (await client.auth.account(address2)).result.value;

      const signDoc1 = makeSignDoc([msg2, msg1], fee, launchpad.chainId, memo, an1, sequence1);
      const signDoc2 = makeSignDoc([msg2, msg1], fee, launchpad.chainId, memo, an2, sequence2);
      const { signature: signature1 } = await account1.signAmino(address1, signDoc1);
      const { signature: signature2 } = await account2.signAmino(address2, signDoc2);
      const signedTx: StdTx = {
        msg: [msg2, msg1],
        fee: fee,
        memo: memo,
        signatures: [signature2, signature1],
      };
      const broadcastResult = await client.broadcastTx(signedTx);
      expect(broadcastResult.code).toBeUndefined();

      await sleep(500);
      const searched = await client.txsQuery(`tx.hash=${broadcastResult.txhash}`);
      expect(searched.txs.length).toEqual(1);
      expect(searched.txs[0].tx.value.signatures).toEqual([signature2, signature1]);
    });

    it("can't send transaction with wrong signature order (1)", async () => {
      pendingWithoutLaunchpad();
      const account1 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(0)],
      });
      const account2 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(1)],
      });
      const [address1, address2] = await Promise.all(
        [account1, account2].map(async (wallet) => {
          return (await wallet.getAccounts())[0].address;
        }),
      );

      const memo = "My first contract on chain";
      const msg1: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address1,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "1234567",
            },
          ],
        },
      };
      const msg2: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address2,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "7654321",
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number: an1, sequence: sequence1 } = (await client.auth.account(address1)).result.value;
      const { account_number: an2, sequence: sequence2 } = (await client.auth.account(address2)).result.value;

      const signDoc1 = makeSignDoc([msg1, msg2], fee, launchpad.chainId, memo, an1, sequence1);
      const signDoc2 = makeSignDoc([msg1, msg2], fee, launchpad.chainId, memo, an2, sequence2);
      const { signature: signature1 } = await account1.signAmino(address1, signDoc1);
      const { signature: signature2 } = await account2.signAmino(address2, signDoc2);
      const signedTx: StdTx = {
        msg: [msg1, msg2],
        fee: fee,
        memo: memo,
        signatures: [signature2, signature1],
      };
      const broadcastResult = await client.broadcastTx(signedTx);
      expect(broadcastResult.code).toEqual(8);
    });

    it("can't send transaction with wrong signature order (2)", async () => {
      pendingWithoutLaunchpad();
      const account1 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(0)],
      });
      const account2 = await Secp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        hdPaths: [makeCosmoshubPath(1)],
      });
      const [address1, address2] = await Promise.all(
        [account1, account2].map(async (wallet) => {
          return (await wallet.getAccounts())[0].address;
        }),
      );

      const memo = "My first contract on chain";
      const msg1: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address1,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "1234567",
            },
          ],
        },
      };
      const msg2: MsgSend = {
        type: "cosmos-sdk/MsgSend",
        value: {
          from_address: address2,
          to_address: defaultRecipientAddress,
          amount: [
            {
              denom: "ucosm",
              amount: "7654321",
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

      const client = LcdClient.withExtensions({ apiUrl: launchpad.endpoint }, setupAuthExtension);
      const { account_number: an1, sequence: sequence1 } = (await client.auth.account(address1)).result.value;
      const { account_number: an2, sequence: sequence2 } = (await client.auth.account(address2)).result.value;

      const signDoc1 = makeSignDoc([msg2, msg1], fee, launchpad.chainId, memo, an1, sequence1);
      const signDoc2 = makeSignDoc([msg2, msg1], fee, launchpad.chainId, memo, an2, sequence2);
      const { signature: signature1 } = await account1.signAmino(address1, signDoc1);
      const { signature: signature2 } = await account2.signAmino(address2, signDoc2);
      const signedTx: StdTx = {
        msg: [msg2, msg1],
        fee: fee,
        memo: memo,
        signatures: [signature1, signature2],
      };
      const broadcastResult = await client.broadcastTx(signedTx);
      expect(broadcastResult.code).toEqual(8);
    });
  });
});
