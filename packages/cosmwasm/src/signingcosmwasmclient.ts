/* eslint-disable @typescript-eslint/naming-convention */
import { Sha256 } from "@cosmjs/crypto";
import { toBase64, toHex } from "@cosmjs/encoding";
import {
  BroadcastMode,
  BroadcastTxFailure,
  BroadcastTxResult,
  buildFeeTable,
  Coin,
  CosmosFeeTable,
  GasLimits,
  GasPrice,
  InProcessOnlineSigner,
  isBroadcastTxFailure,
  Msg,
  MsgSend,
  OfflineSigner,
  OnlineSigner,
  StdFee,
} from "@cosmjs/launchpad";
import { Uint53 } from "@cosmjs/math";
import pako from "pako";

import { isValidBuilder } from "./builder";
import { Account, CosmWasmClient, GetSequenceResult } from "./cosmwasmclient";
import { findAttribute, Log } from "./logs";
import {
  MsgClearAdmin,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from "./msgs";

/**
 * These fees are used by the higher level methods of SigningCosmWasmClient
 */
export interface CosmWasmFeeTable extends CosmosFeeTable {
  readonly upload: StdFee;
  readonly init: StdFee;
  readonly exec: StdFee;
  readonly migrate: StdFee;
  /** Paid when setting the contract admin to a new address or unsetting it */
  readonly changeAdmin: StdFee;
}

function prepareBuilder(buider: string | undefined): string {
  if (buider === undefined) {
    return ""; // normalization needed by backend
  } else {
    if (!isValidBuilder(buider)) throw new Error("The builder (Docker Hub image with tag) is not valid");
    return buider;
  }
}

const defaultGasPrice = GasPrice.fromString("0.025ucosm");
const defaultGasLimits: GasLimits<CosmWasmFeeTable> = {
  upload: 1000000,
  init: 500000,
  migrate: 200000,
  exec: 200000,
  send: 80000,
  changeAdmin: 80000,
};

export interface UploadMeta {
  /**
   * An URL to a .tar.gz archive of the source code of the contract, which can be used to reproducibly build the Wasm bytecode.
   *
   * @see https://github.com/CosmWasm/cosmwasm-verify
   */
  readonly source?: string;
  /**
   * A docker image (including version) to reproducibly build the Wasm bytecode from the source code.
   *
   * @example ```cosmwasm/rust-optimizer:0.8.0```
   * @see https://github.com/CosmWasm/cosmwasm-verify
   */
  readonly builder?: string;
}

export interface UploadResult {
  /** Size of the original wasm code in bytes */
  readonly originalSize: number;
  /** A hex encoded sha256 checksum of the original wasm code (that is stored on chain) */
  readonly originalChecksum: string;
  /** Size of the compressed wasm code in bytes */
  readonly compressedSize: number;
  /** A hex encoded sha256 checksum of the compressed wasm code (that stored in the transaction) */
  readonly compressedChecksum: string;
  /** The ID of the code asigned by the chain */
  readonly codeId: number;
  readonly logs: readonly Log[];
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}

/**
 * The options of an .instantiate() call.
 * All properties are optional.
 */
export interface InstantiateOptions {
  readonly memo?: string;
  readonly transferAmount?: readonly Coin[];
  /**
   * A bech32 encoded address of an admin account.
   * Caution: an admin has the privilege to upgrade a contract. If this is not desired, do not set this value.
   */
  readonly admin?: string;
}

export interface InstantiateResult {
  /** The address of the newly instantiated contract */
  readonly contractAddress: string;
  readonly logs: readonly Log[];
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}

/**
 * Result type of updateAdmin and clearAdmin
 */
export interface ChangeAdminResult {
  readonly logs: readonly Log[];
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}

export interface MigrateResult {
  readonly logs: readonly Log[];
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}

export interface ExecuteResult {
  readonly logs: readonly Log[];
  /** Transaction hash (might be used as transaction ID). Guaranteed to be non-empty upper-case hex */
  readonly transactionHash: string;
}

function createBroadcastTxErrorMessage(result: BroadcastTxFailure): string {
  return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

/** Use for testing only */
export interface PrivateSigningCosmWasmClient {
  readonly fees: CosmWasmFeeTable;
}

export class SigningCosmWasmClient extends CosmWasmClient {
  public readonly senderAddress: string;

  private readonly signer: OnlineSigner;
  private readonly fees: CosmWasmFeeTable;

  public static fromOfflineSigner(
    apiUrl: string,
    senderAddress: string,
    signer: OfflineSigner,
    gasPrice: GasPrice = defaultGasPrice,
    gasLimits: Partial<GasLimits<CosmosFeeTable>> = {},
    broadcastMode = BroadcastMode.Block,
  ): SigningCosmWasmClient {
    const online = new InProcessOnlineSigner(signer, apiUrl, broadcastMode);
    return new SigningCosmWasmClient(apiUrl, senderAddress, online, gasPrice, gasLimits, broadcastMode);
  }

  /**
   * Creates a new client with signing capability to interact with a CosmWasm blockchain. This is the bigger brother of CosmWasmClient.
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
    gasLimits: Partial<GasLimits<CosmWasmFeeTable>> = {},
    broadcastMode = BroadcastMode.Block,
  ) {
    super(apiUrl, broadcastMode);
    this.anyValidAddress = senderAddress;
    this.senderAddress = senderAddress;
    this.signer = signer;
    this.fees = buildFeeTable<CosmWasmFeeTable>(gasPrice, defaultGasLimits, gasLimits);
  }

  public async getSequence(address?: string): Promise<GetSequenceResult> {
    return super.getSequence(address || this.senderAddress);
  }

  public async getAccount(address?: string): Promise<Account | undefined> {
    return super.getAccount(address || this.senderAddress);
  }

  /** Uploads code and returns a receipt, including the code ID */
  public async upload(wasmCode: Uint8Array, meta: UploadMeta = {}, memo = ""): Promise<UploadResult> {
    const source = meta.source || "";
    const builder = prepareBuilder(meta.builder);

    const compressed = pako.gzip(wasmCode, { level: 9 });
    const storeCodeMsg: MsgStoreCode = {
      type: "wasm/MsgStoreCode",
      value: {
        sender: this.senderAddress,
        wasm_byte_code: toBase64(compressed),
        source: source,
        builder: builder,
      },
    };
    const result = await this.signAndBroadcast([storeCodeMsg], this.fees.upload, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    const codeIdAttr = findAttribute(result.logs, "message", "code_id");
    return {
      originalSize: wasmCode.length,
      originalChecksum: toHex(new Sha256(wasmCode).digest()),
      compressedSize: compressed.length,
      compressedChecksum: toHex(new Sha256(compressed).digest()),
      codeId: Number.parseInt(codeIdAttr.value, 10),
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async instantiate(
    codeId: number,
    initMsg: Record<string, unknown>,
    label: string,
    options: InstantiateOptions = {},
  ): Promise<InstantiateResult> {
    const instantiateMsg: MsgInstantiateContract = {
      type: "wasm/MsgInstantiateContract",
      value: {
        sender: this.senderAddress,
        code_id: new Uint53(codeId).toString(),
        label: label,
        init_msg: initMsg,
        init_funds: options.transferAmount || [],
        admin: options.admin,
      },
    };
    const result = await this.signAndBroadcast([instantiateMsg], this.fees.init, options.memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    const contractAddressAttr = findAttribute(result.logs, "message", "contract_address");
    return {
      contractAddress: contractAddressAttr.value,
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async updateAdmin(contractAddress: string, newAdmin: string, memo = ""): Promise<ChangeAdminResult> {
    const updateAdminMsg: MsgUpdateAdmin = {
      type: "wasm/MsgUpdateAdmin",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        new_admin: newAdmin,
      },
    };
    const result = await this.signAndBroadcast([updateAdminMsg], this.fees.changeAdmin, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async clearAdmin(contractAddress: string, memo = ""): Promise<ChangeAdminResult> {
    const clearAdminMsg: MsgClearAdmin = {
      type: "wasm/MsgClearAdmin",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
      },
    };
    const result = await this.signAndBroadcast([clearAdminMsg], this.fees.changeAdmin, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async migrate(
    contractAddress: string,
    codeId: number,
    migrateMsg: Record<string, unknown>,
    memo = "",
  ): Promise<MigrateResult> {
    const msg: MsgMigrateContract = {
      type: "wasm/MsgMigrateContract",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        code_id: new Uint53(codeId).toString(),
        msg: migrateMsg,
      },
    };
    const result = await this.signAndBroadcast([msg], this.fees.migrate, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async execute(
    contractAddress: string,
    handleMsg: Record<string, unknown>,
    memo = "",
    transferAmount?: readonly Coin[],
  ): Promise<ExecuteResult> {
    const executeMsg: MsgExecuteContract = {
      type: "wasm/MsgExecuteContract",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        msg: handleMsg,
        sent_funds: transferAmount || [],
      },
    };
    const result = await this.signAndBroadcast([executeMsg], this.fees.exec, memo);
    if (isBroadcastTxFailure(result)) {
      throw new Error(createBroadcastTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
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
    return this.signAndBroadcast([sendMsg], this.fees.send, memo);
  }

  /**
   * Gets account number and sequence from the API, creates a sign doc,
   * creates a single signature, assembles the signed transaction and broadcasts it.
   */
  public async signAndBroadcast(msgs: readonly Msg[], fee?: StdFee, memo = ""): Promise<BroadcastTxResult> {
    const request = {
      msgs: msgs,
      chainId: await this.getChainId(),
      memo: memo,
      fee: fee,
    };
    return this.signer.signAndBroadcast(this.senderAddress, request);
  }
}
