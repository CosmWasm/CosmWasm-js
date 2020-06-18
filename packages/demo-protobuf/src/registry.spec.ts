/* eslint-disable @typescript-eslint/camelcase */
import { assert } from "@cosmjs/utils";

import { MsgDemo as MsgDemoType } from "./demo";
import { cosmos_sdk as cosmosSdk } from "./generated/codecimpl";
import { Registry } from "./registry";

type MsgDemo = {
  readonly example: string;
};

describe("registry demo", () => {
  it("works with a default msg", () => {
    const registry = new Registry();
    const Coin = registry.lookupType("/cosmos.Coin")!;
    const MsgSend = registry.lookupType("/cosmos.bank.MsgSend")!;
    const TxBody = registry.lookupType("/cosmos.tx.TxBody")!;
    const Any = registry.lookupType("/google.protobuf.Any")!;

    const coin = Coin.create({
      denom: "ucosm",
      amount: "1234567890",
    });
    const msgSend = (MsgSend.create({
      fromAddress: Uint8Array.from(Array.from({ length: 20 }, () => 1)),
      toAddress: Uint8Array.from(Array.from({ length: 20 }, () => 2)),
      amount: [coin],
    }) as unknown) as cosmosSdk.x.bank.v1.MsgSend;
    const msgSendBytes = MsgSend.encode(msgSend).finish();
    const msgSendWrapped = Any.create({
      type_url: "/cosmos.bank.MsgSend",
      value: msgSendBytes,
    });
    const txBody = TxBody.create({
      messages: [msgSendWrapped],
      memo: "Some memo",
      timeoutHeight: 9999,
      extensionOptions: [],
    });
    const txBodyBytes = TxBody.encode(txBody).finish();

    const txBodyDecoded = (TxBody.decode(txBodyBytes) as unknown) as cosmosSdk.tx.v1.TxBody;
    const msg = txBodyDecoded.messages[0];
    assert(msg.type_url);
    assert(msg.value);

    const decoder = registry.lookupType(msg.type_url)!;
    const msgSendDecoded = (decoder.decode(msg.value) as unknown) as cosmosSdk.x.bank.v1.MsgSend;

    // fromAddress and toAddress are now Buffers
    expect(Uint8Array.from(msgSendDecoded.fromAddress)).toEqual(msgSend.fromAddress);
    expect(Uint8Array.from(msgSendDecoded.toAddress)).toEqual(msgSend.toAddress);
    expect(msgSendDecoded.amount).toEqual(msgSend.amount);
  });

  it("works with a custom msg", () => {
    const typeUrl = "/demo.MsgDemo";
    const registry = new Registry([[typeUrl, MsgDemoType]]);
    const MsgDemo = registry.lookupType(typeUrl)!;
    const TxBody = registry.lookupType("/cosmos.tx.TxBody")!;
    const Any = registry.lookupType("/google.protobuf.Any")!;

    const msgDemo = (MsgDemo.create({
      example: "Some example text",
    }) as unknown) as MsgDemo;
    const msgDemoBytes = MsgDemo.encode(msgDemo).finish();
    const msgDemoWrapped = Any.create({
      type_url: "/demo.MsgDemo",
      value: msgDemoBytes,
    });
    const txBody = TxBody.create({
      messages: [msgDemoWrapped],
      memo: "Some memo",
      timeoutHeight: 9999,
      extensionOptions: [],
    });
    const txBodyBytes = TxBody.encode(txBody).finish();

    const txBodyDecoded = (TxBody.decode(txBodyBytes) as unknown) as cosmosSdk.tx.v1.TxBody;
    const msg = txBodyDecoded.messages[0];
    assert(msg.type_url);
    assert(msg.value);

    const decoder = registry.lookupType(msg.type_url)!;
    const msgDemoDecoded = (decoder.decode(msg.value) as unknown) as MsgDemo;
    expect(msgDemoDecoded.example).toEqual(msgDemo.example);
  });
});
