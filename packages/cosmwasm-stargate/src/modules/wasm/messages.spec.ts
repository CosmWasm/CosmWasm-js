import { toUtf8 } from "@cosmjs/encoding";
import Long from "long";

import { importWasmMessages } from "./messages";

describe("messages", () => {
  describe("importWasmMessages", () => {
    it("works for MsgExecuteContract", () => {
      // wasmd tx wasm execute wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d '{"contract":"specific"}' --amount 123ucosm --from wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd --chain-id test123 --offline --generate-only | jq .body.messages -c
      const msgs = importWasmMessages(
        `[{"@type":"/cosmwasm.wasm.v1.MsgExecuteContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","contract":"wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]}]`,
      );
      expect(msgs).toEqual([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            contract: "wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
      ]);
    });

    it("works for two MsgExecuteContract", () => {
      // same message as above, but 2x (with different amounts)
      const msgs = importWasmMessages(
        `[{"@type":"/cosmwasm.wasm.v1.MsgExecuteContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","contract":"wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]},{"@type":"/cosmwasm.wasm.v1.MsgExecuteContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","contract":"wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"456"}]}]`,
      );
      expect(msgs).toEqual([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            contract: "wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            contract: "wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "456",
              },
            ],
          },
        },
      ]);
    });

    it("works for MsgInstantiateContract", () => {
      // All fields set
      // wasmd tx wasm instantiate 55 '{"contract":"specific"}' --label "unique instance" --admin wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y --amount 123ucosm --from wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd --chain-id test123 --offline --generate-only | jq .body.messages -c
      const msgs1 = importWasmMessages(
        `[{"@type":"/cosmwasm.wasm.v1.MsgInstantiateContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","admin":"wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y","code_id":"55","label":"unique instance","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]}]`,
      );
      expect(msgs1).toEqual([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            codeId: Long.fromNumber(55, true),
            admin: "wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y",
            label: "unique instance",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
      ]);

      // No admin
      // wasmd tx wasm instantiate 55 '{"contract":"specific"}' --label "unique instance" --no-admin --amount 123ucosm --from wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd --chain-id test123 --offline --generate-only | jq .body.messages -c
      const msgs2 = importWasmMessages(
        `[{"@type":"/cosmwasm.wasm.v1.MsgInstantiateContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","admin":"","code_id":"55","label":"unique instance","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]}]`,
      );
      expect(msgs2).toEqual([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            codeId: Long.fromNumber(55, true),
            admin: "",
            label: "unique instance",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
      ]);
    });

    it("works for mixed MsgExecuteContract and MsgInstantiateContract", () => {
      const msgs = importWasmMessages(
        `[{"@type":"/cosmwasm.wasm.v1.MsgExecuteContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","contract":"wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]},{"@type":"/cosmwasm.wasm.v1.MsgInstantiateContract","sender":"wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd","admin":"wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y","code_id":"55","label":"unique instance","msg":{"contract":"specific"},"funds":[{"denom":"ucosm","amount":"123"}]}]`,
      );
      expect(msgs).toEqual([
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            contract: "wasm1hsm76p4ahyhl5yh3ve9ur49r5kemhp2r93f89d",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
        {
          typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
          value: {
            sender: "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd",
            codeId: Long.fromNumber(55, true),
            admin: "wasm1hhg2rlu9jscacku2wwckws7932qqqu8xm5ca8y",
            label: "unique instance",
            msg: toUtf8(`{"contract":"specific"}`),
            funds: [
              {
                denom: "ucosm",
                amount: "123",
              },
            ],
          },
        },
      ]);
    });
  });
});
