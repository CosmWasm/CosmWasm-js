#!/usr/bin/env node

/* eslint-disable @typescript-eslint/camelcase */
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm");
const { Secp256k1Pen } = require("@cosmjs/sdk38");
const fs = require("fs");

const httpUrl = "http://localhost:1317";
const alice = {
  mnemonic: "enlist hip relief stomach skate base shallow young switch frequent cry park",
  address0: "cosmos14qemq0vw6y3gc3u3e0aty2e764u4gs5le3hada",
};

const codeMeta = {
  // TODO: Update once final 0.9.0 compatible contract is published (https://github.com/CosmWasm/cosmwasm-examples/pull/77)
  source: "https://crates.io/api/v1/crates/cw-nameservice/0.4.0/download",
  builder: "cosmwasm/rust-optimizer:0.8.0",
};

const free = {
  label: "Free",
  initMsg: {},
};

const luxury = {
  label: "Lux,ury",
  initMsg: {
    purchase_price: {
      denom: "ucosm",
      amount: "2000000",
    },
    transfer_price: {
      denom: "ucosm",
      amount: "1000000",
    },
  },
};

async function main() {
  const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
  const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));

  const wasm = fs.readFileSync(__dirname + "/contracts/cw-nameservice.wasm");
  const uploadReceipt = await client.upload(wasm, codeMeta, "Upload Name Service code");
  console.info(`Upload succeeded. Receipt: ${JSON.stringify(uploadReceipt)}`);

  for (const { label, initMsg } of [free, luxury]) {
    const memo = `Create an nameservice instance "${label}"`;
    const { contractAddress } = await client.instantiate(uploadReceipt.codeId, initMsg, label, memo);
    console.info(`Contract "${label}" instantiated at ${contractAddress}`);
  }
}

main().then(
  () => {
    console.info("Done deploying nameservice instances.");
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
