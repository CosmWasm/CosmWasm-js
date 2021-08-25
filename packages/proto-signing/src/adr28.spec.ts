import { Bech32 } from "@cosmjs/encoding";
import { Uint64 } from "@cosmjs/math";

import { moduleAddressRaw } from "./adr28";

describe("adr28", () => {
  describe("moduleAddressRaw", () => {
    it("can be used for wasm contract address derivation", () => {
      function contractAddressRaw(codeId: number, contractId: number): Uint8Array {
        const key = new Uint8Array([
          ...Uint64.fromNumber(codeId).toBytesBigEndian(),
          ...Uint64.fromNumber(contractId).toBytesBigEndian(),
        ]);
        return moduleAddressRaw("wasm", key).slice(0, 20);
      }

      function contractAddress(codeId: number, contractId: number): string {
        return Bech32.encode("cosmos", contractAddressRaw(codeId, contractId));
      }

      // Test vectors from https://github.com/CosmWasm/wasmd/pull/565
      expect(contractAddress(1, 1)).toEqual("cosmos14hj2tavq8fpesdwxxcu44rty3hh90vhuc53mp6");
      expect(contractAddress(1, 100)).toEqual("cosmos1mujpjkwhut9yjw4xueyugc02evfv46y04aervg");
      expect(contractAddress(2 ** 32, 17)).toEqual("cosmos1673hrexz4h6s0ft04l96ygq667djzh2nvy7fsu");
      expect(contractAddress(22, 2 ** 32)).toEqual("cosmos10q3pgfvmeyy0veekgtqhxujxkhz0vm9z65ckqh");
    });
  });
});
