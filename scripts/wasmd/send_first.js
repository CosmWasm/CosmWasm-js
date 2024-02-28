#!/usr/bin/env -S yarn node

/* eslint-disable @typescript-eslint/naming-convention */
const { coins } = require("@cosmjs/amino");
const { Random } = require("@cosmjs/crypto");
const { toBech32 } = require("@cosmjs/encoding");
const { DirectSecp256k1HdWallet } = require("@cosmjs/proto-signing");
const {
  assertIsDeliverTxSuccess,
  SigningStargateClient,
  calculateFee,
} = require("@cosmjs/stargate");

const rpcUrl = "http://localhost:26659";
const prefix = "wasm";
const faucet = {
  mnemonic:
    "flat ski gap size ankle rifle congress month nice state follow mechanic produce cube moment boss enlist disorder during logic brother ride erosion member",
  address0: "wasm100xecaptkwqaq6e53s8zxf2vkzz47n6swseykt",
};

async function main() {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, { prefix: prefix });
  const client = await SigningStargateClient.connectWithSigner(rpcUrl, wallet, { prefix: prefix });
  const recipient = "wasm14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk";
  const amount = coins(226644, "ucosm");
  const fee = calculateFee(100_000, "0.025ucosm");
  const memo = "Ensure chain has my pubkey";
  const sendResult = await client.sendTokens(faucet.address0, recipient, amount, fee, memo);
  assertIsDeliverTxSuccess(sendResult);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
