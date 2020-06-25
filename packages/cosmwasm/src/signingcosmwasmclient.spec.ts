import { Sha256 } from "@cosmjs/crypto";
import { toHex } from "@cosmjs/encoding";
import { coin, coins, Secp256k1Pen } from "@cosmjs/sdk38";
import { assert } from "@cosmjs/utils";

import { isPostTxFailure, PrivateCosmWasmClient } from "./cosmwasmclient";
import { RestClient } from "./restclient";
import { SigningCosmWasmClient, UploadMeta } from "./signingcosmwasmclient";
import { alice, getHackatom, makeRandomAddress, pendingWithoutWasmd, unused } from "./testutils.spec";

const httpUrl = "http://localhost:1317";

describe("SigningCosmWasmClient", () => {
  describe("makeReadOnly", () => {
    it("can be constructed", async () => {
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      expect(client).toBeTruthy();
    });
  });

  describe("getHeight", () => {
    it("always uses authAccount implementation", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));

      const openedClient = (client as unknown) as PrivateCosmWasmClient;
      const blockLatestSpy = spyOn(openedClient.restClient, "blocksLatest").and.callThrough();
      const authAccountsSpy = spyOn(openedClient.restClient, "authAccounts").and.callThrough();

      const height = await client.getHeight();
      expect(height).toBeGreaterThan(0);

      expect(blockLatestSpy).toHaveBeenCalledTimes(0);
      expect(authAccountsSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("upload", () => {
    it("works", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const wasm = getHackatom().data;
      const {
        codeId,
        originalChecksum,
        originalSize,
        compressedChecksum,
        compressedSize,
      } = await client.upload(wasm);
      expect(originalChecksum).toEqual(toHex(new Sha256(wasm).digest()));
      expect(originalSize).toEqual(wasm.length);
      expect(compressedChecksum).toMatch(/^[0-9a-f]{64}$/);
      expect(compressedSize).toBeLessThan(wasm.length * 0.5);
      expect(codeId).toBeGreaterThanOrEqual(1);
    });

    it("can set builder and source", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const hackatom = getHackatom();

      const meta: UploadMeta = {
        source: "https://crates.io/api/v1/crates/cw-nameservice/0.1.0/download",
        builder: "confio/cosmwasm-opt:0.6.2",
      };
      const { codeId } = await client.upload(hackatom.data, meta);

      const codeDetails = await client.getCodeDetails(codeId);
      expect(codeDetails.source).toEqual(meta.source);
      expect(codeDetails.builder).toEqual(meta.builder);
    });
  });

  describe("instantiate", () => {
    it("works with transfer amount", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      const transferAmount = [coin(1234, "ucosm"), coin(321, "ustake")];
      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "My cool label",
        {
          memo: "Let's see if the memo is used",
          transferAmount,
        },
      );

      const rest = new RestClient(httpUrl);
      const balance = (await rest.authAccounts(contractAddress)).result.value.coins;
      expect(balance).toEqual(transferAmount);
    });

    it("works with admin", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "My cool label",
        { admin: unused.address },
      );

      const rest = new RestClient(httpUrl);
      const contract = await rest.getContractInfo(contractAddress);
      assert(contract);
      expect(contract.admin).toEqual(unused.address);
    });

    it("can instantiate one code multiple times", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      const contractAddress1 = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: makeRandomAddress(),
        },
        "contract 1",
      );
      const contractAddress2 = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: makeRandomAddress(),
        },
        "contract 2",
      );
      expect(contractAddress1).not.toEqual(contractAddress2);
    });
  });

  describe("updateAdmin", () => {
    it("can update an admin", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "My cool label",
        {
          admin: alice.address0,
        },
      );

      const rest = new RestClient(httpUrl);
      const state1 = await rest.getContractInfo(contractAddress);
      assert(state1);
      expect(state1.admin).toEqual(alice.address0);

      await client.updateAdmin(contractAddress, unused.address);

      const state2 = await rest.getContractInfo(contractAddress);
      assert(state2);
      expect(state2.admin).toEqual(unused.address);
    });
  });

  describe("clearAdmin", () => {
    it("can clear an admin", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "My cool label",
        {
          admin: alice.address0,
        },
      );

      const rest = new RestClient(httpUrl);
      const state1 = await rest.getContractInfo(contractAddress);
      assert(state1);
      expect(state1.admin).toEqual(alice.address0);

      await client.clearAdmin(contractAddress);

      const state2 = await rest.getContractInfo(contractAddress);
      assert(state2);
      expect(state2.admin).toBeUndefined();
    });
  });

  describe("migrate", () => {
    it("can can migrate from one code ID to another", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId: codeId1 } = await client.upload(getHackatom().data);
      const { codeId: codeId2 } = await client.upload(getHackatom().data);

      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId1,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "My cool label",
        {
          admin: alice.address0,
        },
      );

      const rest = new RestClient(httpUrl);
      const state1 = await rest.getContractInfo(contractAddress);
      assert(state1);
      expect(state1.admin).toEqual(alice.address0);

      const newVerifier = makeRandomAddress();
      await client.migrate(contractAddress, codeId2, { verifier: newVerifier });

      const state2 = await rest.getContractInfo(contractAddress);
      assert(state2);
      expect(state2).toEqual({
        ...state1,
        // eslint-disable-next-line @typescript-eslint/camelcase
        code_id: codeId2,
      });
    });
  });

  describe("execute", () => {
    it("works", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));
      const { codeId } = await client.upload(getHackatom().data);

      // instantiate
      const transferAmount = [coin(233444, "ucosm"), coin(5454, "ustake")];
      const beneficiaryAddress = makeRandomAddress();
      const { contractAddress } = await client.instantiate(
        codeId,
        {
          verifier: alice.address0,
          beneficiary: beneficiaryAddress,
        },
        "amazing random contract",
        {
          transferAmount,
        },
      );

      // execute
      const result = await client.execute(contractAddress, { release: {} }, undefined);
      const wasmEvent = result.logs.find(() => true)?.events.find((e) => e.type === "wasm");
      assert(wasmEvent, "Event of type wasm expected");
      expect(wasmEvent.attributes).toContain({ key: "action", value: "release" });
      expect(wasmEvent.attributes).toContain({
        key: "destination",
        value: beneficiaryAddress,
      });

      // Verify token transfer from contract to beneficiary
      const rest = new RestClient(httpUrl);
      const beneficiaryBalance = (await rest.authAccounts(beneficiaryAddress)).result.value.coins;
      expect(beneficiaryBalance).toEqual(transferAmount);
      const contractBalance = (await rest.authAccounts(contractAddress)).result.value.coins;
      expect(contractBalance).toEqual([]);
    });
  });

  describe("sendTokens", () => {
    it("works", async () => {
      pendingWithoutWasmd();
      const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
      const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));

      // instantiate
      const transferAmount = coins(7890, "ucosm");
      const beneficiaryAddress = makeRandomAddress();

      // no tokens here
      const before = await client.getAccount(beneficiaryAddress);
      expect(before).toBeUndefined();

      // send
      const result = await client.sendTokens(beneficiaryAddress, transferAmount, "for dinner");
      assert(!isPostTxFailure(result));
      const [firstLog] = result.logs;
      expect(firstLog).toBeTruthy();

      // got tokens
      const after = await client.getAccount(beneficiaryAddress);
      assert(after);
      expect(after.balance).toEqual(transferAmount);
    });
  });
});
