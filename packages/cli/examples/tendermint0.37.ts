import { coins } from "@cosmjs/amino";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { assertIsDeliverTxSuccess, GasPrice, SigningStargateClient } from "@cosmjs/stargate";
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";

// Network config
const prefix = "wasm";
const rpcEndpoint = "http://146.190.50.102:26657"; // or 137.184.83.82:26657
const gasPrice = GasPrice.fromString("0.001stake");

// Wallet wasm16jd84xm6yerfaafvtp7s6tpetdqkpu6wxumszp
const mnemonic = "royal next favorite duck plastic august rent knee strong weather father opinion";
const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: prefix });
const [account] = await wallet.getAccounts();
console.log("Signer address:", account.address);

// Setup client. In contrast to most other examples out there, we create the Tendermint client
// explicitly. Otherwise the 0.34 client will be used.
const tmClient = await Tendermint37Client.connect(rpcEndpoint);
const version = (await tmClient.status()).nodeInfo.version;
console.log("Tendermint version:", version);
const client = await SigningStargateClient.createWithSigner(tmClient, wallet, { gasPrice: gasPrice });

// Get my balance
const balance = await client.getAllBalances(account.address);
console.log("Balance:", balance);

// Send a transaction
const recipient = "wasm142u9fgcjdlycfcez3lw8x6x5h7rfjlnfaallkd";
const result = await client.sendTokens(
  account.address,
  recipient,
  coins(1, "stake"),
  1.5, // In the current testnet the default multiplier of 1.3 is not sufficient 🤷‍♂️
  "Have fun with this gift",
);
assertIsDeliverTxSuccess(result);
console.log("Successfully broadcasted:", result);

client.disconnect();
