/* eslint-disable @typescript-eslint/naming-convention */
import { Coin } from "./coins";
import { Account, BroadcastTxResult, CosmosClient, GetSequenceResult } from "./cosmosclient";
import { buildFeeTable, FeeTable, GasLimits, GasPrice } from "./gas";
import { BroadcastMode } from "./lcdapi";
import { MsgSend } from "./msgs";
import { InProcessOnlineSigner, OnlineSigner } from "./onlinesigner";
import { StdFee } from "./types";
import { OfflineSigner } from "./wallet";

/**
 * These fees are used by the higher level methods of SigningCosmosClient
 */
export interface CosmosFeeTable extends FeeTable {
  readonly send: StdFee;
}

const defaultGasPrice = GasPrice.fromString("0.025ucosm");
const defaultGasLimits: GasLimits<CosmosFeeTable> = { send: 80000 };

/** Use for testing only */
export interface PrivateSigningCosmosClient {
  readonly fees: CosmosFeeTable;
}

export class SigningCosmosClient extends CosmosClient {
  public readonly senderAddress: string;

  private readonly signer: OnlineSigner;
  private readonly fees: CosmosFeeTable;

  public static fromOfflineSigner(
    apiUrl: string,
    senderAddress: string,
    signer: OfflineSigner,
    gasPrice: GasPrice = defaultGasPrice,
    gasLimits: Partial<GasLimits<CosmosFeeTable>> = {},
    broadcastMode = BroadcastMode.Block,
  ): SigningCosmosClient {
    const online = new InProcessOnlineSigner(signer, apiUrl, broadcastMode);
    return new SigningCosmosClient(apiUrl, senderAddress, online, gasPrice, gasLimits, broadcastMode);
  }

  /**
   * Creates a new client with signing capability to interact with a Cosmos SDK blockchain. This is the bigger brother of CosmosClient.
   *
   * This instance does a lot of caching. In order to benefit from that you should try to use one instance
   * for the lifetime of your application. When switching backends, a new instance must be created.
   *
   * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
   * @param senderAddress The address that will sign and send transactions using this instance
   * @param signer An implementation of OfflineSigner which can provide signatures for transactions, potentially requiring user input.
   * @param gasPrice The price paid per unit of gas
   * @param gasLimits Custom overrides for gas limits related to specific transaction types
   * @param broadcastMode Defines at which point of the transaction processing the broadcastTx method returns
   */
  public constructor(
    apiUrl: string,
    senderAddress: string,
    signer: OnlineSigner,
    gasPrice: GasPrice = defaultGasPrice,
    gasLimits: Partial<GasLimits<CosmosFeeTable>> = {},
    broadcastMode = BroadcastMode.Block,
  ) {
    super(apiUrl, broadcastMode);
    this.anyValidAddress = senderAddress;
    this.senderAddress = senderAddress;
    this.signer = signer;
    this.fees = buildFeeTable<CosmosFeeTable>(gasPrice, defaultGasLimits, gasLimits);
  }

  public async getSequence(address?: string): Promise<GetSequenceResult> {
    return super.getSequence(address || this.senderAddress);
  }

  public async getAccount(address?: string): Promise<Account | undefined> {
    return super.getAccount(address || this.senderAddress);
  }

  public async sendTokens(
    recipientAddress: string,
    transferAmount: readonly Coin[],
    memo = "",
  ): Promise<BroadcastTxResult> {
    const sendMsg: MsgSend = {
      type: "cosmos-sdk/MsgSend",
      value: {
        from_address: this.senderAddress,
        to_address: recipientAddress,
        amount: transferAmount,
      },
    };
    const request = {
      msgs: [sendMsg],
      chainId: await this.getChainId(),
      memo: memo,
      fees: this.fees.send,
    };
    return this.signer.signAndSubmit(this.senderAddress, request);
  }
}
