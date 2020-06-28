#!/usr/bin/env node

/* eslint-disable @typescript-eslint/camelcase */
const { SigningCosmWasmClient } = require("@cosmjs/cosmwasm");
const { Secp256k1Pen } = require("@cosmjs/sdk38");
const fs = require("fs");

const httpUrl = "http://localhost:1317";
const alice = {
  mnemonic: "enlist hip relief stomach skate base shallow young switch frequent cry park",
  address0: "cosmos14qemq0vw6y3gc3u3e0aty2e764u4gs5le3hada",
  address1: "cosmos1hhg2rlu9jscacku2wwckws7932qqqu8x3gfgw0",
  address2: "cosmos1xv9tklw7d82sezh9haa573wufgy59vmwe6xxe5",
  address3: "cosmos17yg9mssjenmc3jkqth6ulcwj9cxujrxxzezwta",
  address4: "cosmos1f7j7ryulwjfe9ljplvhtcaxa6wqgula3etktce",
};
const unused = {
  address: "cosmos1cjsxept9rkggzxztslae9ndgpdyt2408lk850u",
};
const guest = {
  address: "cosmos17d0jcz59jf68g52vq38tuuncmwwjk42u6mcxej",
};

const codeMeta = {
  source: "https://crates.io/api/v1/crates/cw-erc20/0.5.1/download",
  builder: "cosmwasm/rust-optimizer:0.8.0",
};

const initMsgHash = {
  decimals: 5,
  name: "Hash token",
  symbol: "HASH",
  initial_balances: [
    {
      address: alice.address0,
      amount: "11",
    },
    {
      address: alice.address1,
      amount: "11",
    },
    {
      address: alice.address2,
      amount: "11",
    },
    {
      address: alice.address3,
      amount: "11",
    },
    {
      address: alice.address4,
      amount: "11",
    },
    {
      address: unused.address,
      amount: "12812345",
    },
    {
      address: guest.address,
      amount: "22004000000",
    },
  ],
};
const initMsgIsa = {
  decimals: 0,
  name: "Isa Token",
  symbol: "ISA",
  initial_balances: [
    {
      address: alice.address0,
      amount: "999999999",
    },
    {
      address: alice.address1,
      amount: "999999999",
    },
    {
      address: alice.address2,
      amount: "999999999",
    },
    {
      address: alice.address3,
      amount: "999999999",
    },
    {
      address: alice.address4,
      amount: "999999999",
    },
    {
      address: unused.address,
      amount: "42",
    },
  ],
};
const initMsgJade = {
  decimals: 18,
  name: "Jade Token",
  symbol: "JADE",
  initial_balances: [
    {
      address: alice.address0,
      amount: "189189189000000000000000000", // 189189189 JADE
    },
    {
      address: alice.address1,
      amount: "189189189000000000000000000", // 189189189 JADE
    },
    {
      address: alice.address2,
      amount: "189189189000000000000000000", // 189189189 JADE
    },
    {
      address: alice.address3,
      amount: "189189189000000000000000000", // 189189189 JADE
    },
    {
      address: alice.address4,
      amount: "189189189000000000000000000", // 189189189 JADE
    },
    {
      address: guest.address,
      amount: "189500000000000000000", // 189.5 JADE
    },
  ],
};

async function main() {
  const pen = await Secp256k1Pen.fromMnemonic(alice.mnemonic);
  const client = new SigningCosmWasmClient(httpUrl, alice.address0, (signBytes) => pen.sign(signBytes));

  const wasm = fs.readFileSync(__dirname + "/contracts/cw-erc20.wasm");
  const uploadReceipt = await client.upload(wasm, codeMeta, "Upload ERC20 contract");
  console.info(`Upload succeeded. Receipt: ${JSON.stringify(uploadReceipt)}`);

  for (const initMsg of [initMsgHash, initMsgIsa, initMsgJade]) {
    const { contractAddress } = await client.instantiate(uploadReceipt.codeId, initMsg, initMsg.symbol, {
      memo: `Create an ERC20 instance for ${initMsg.symbol}`,
    });
    console.info(`Contract instantiated for ${initMsg.symbol} at ${contractAddress}`);
  }
}

main().then(
  () => {
    console.info("All done, let the coins flow.");
    process.exit(0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
