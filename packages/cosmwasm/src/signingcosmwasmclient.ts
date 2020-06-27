import { Sha256 } from "@cosmjs/crypto";
import { toBase64, toHex } from "@cosmjs/encoding";
import { Uint53 } from "@cosmjs/math";
import {
  BroadcastMode,
  Coin,
  coins,
  makeSignBytes,
  MsgSend,
  StdFee,
  StdSignature,
  StdTx,
} from "@cosmjs/sdk38";
import pako from "pako";

import { isValidBuilder } from "./builder";
import {
  Account,
  CosmWasmClient,
  GetNonceResult,
  isPostTxFailure,
  PostTxFailure,
  PostTxResult,
} from "./cosmwasmclient";
import { findAttribute, Log } from "./logs";
import {
  MsgClearAdmin,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from "./msgs";

export interface SigningCallback {
  (signBytes: Uint8Array): Promise<StdSignature>;
}

export interface FeeTable {
  readonly upload: StdFee;
  readonly init: StdFee;
  readonly exec: StdFee;
  readonly migrate: StdFee;
  readonly send: StdFee;
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

const defaultFees: FeeTable = {
  upload: {
    amount: coins(25000, "ucosm"),
    gas: "1000000", // one million
  },
  init: {
    amount: coins(12500, "ucosm"),
    gas: "500000", // 500k
  },
  migrate: {
    amount: coins(5000, "ucosm"),
    gas: "200000", // 200k
  },
  exec: {
    amount: coins(5000, "ucosm"),
    gas: "200000", // 200k
  },
  send: {
    amount: coins(2000, "ucosm"),
    gas: "80000", // 80k
  },
  changeAdmin: {
    amount: coins(2000, "ucosm"),
    gas: "80000", // 80k
  },
};

export interface UploadMeta {
  /** The source URL */
  readonly source?: string;
  /** The builder tag */
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

function createPostTxErrorMessage(result: PostTxFailure): string {
  return `Error when posting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

export class SigningCosmWasmClient extends CosmWasmClient {
  public readonly senderAddress: string;

  private readonly signCallback: SigningCallback;
  private readonly fees: FeeTable;

  /**
   * Creates a new client with signing capability to interact with a CosmWasm blockchain. This is the bigger brother of CosmWasmClient.
   *
   * This instance does a lot of caching. In order to benefit from that you should try to use one instance
   * for the lifetime of your application. When switching backends, a new instance must be created.
   *
   * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
   * @param senderAddress The address that will sign and send transactions using this instance
   * @param signCallback An asynchonous callback to create a signature for a given transaction. This can be implemented using secure key stores that require user interaction.
   * @param customFees The fees that are paid for transactions
   * @param broadcastMode Defines at which point of the transaction processing the postTx method (i.e. transaction broadcasting) returns
   */
  public constructor(
    apiUrl: string,
    senderAddress: string,
    signCallback: SigningCallback,
    customFees?: Partial<FeeTable>,
    broadcastMode = BroadcastMode.Block,
  ) {
    super(apiUrl, broadcastMode);
    this.anyValidAddress = senderAddress;

    this.senderAddress = senderAddress;
    this.signCallback = signCallback;
    this.fees = { ...defaultFees, ...(customFees || {}) };
  }

  public async getNonce(address?: string): Promise<GetNonceResult> {
    return super.getNonce(address || this.senderAddress);
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
      type: "wasm/store-code",
      value: {
        sender: this.senderAddress,
        // eslint-disable-next-line @typescript-eslint/camelcase
        wasm_byte_code: toBase64(compressed),
        source: source,
        builder: builder,
      },
    };
    const fee = this.fees.upload;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([storeCodeMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [storeCodeMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
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
    initMsg: object,
    label: string,
    options: InstantiateOptions = {},
  ): Promise<InstantiateResult> {
    const instantiateMsg: MsgInstantiateContract = {
      type: "wasm/instantiate",
      value: {
        sender: this.senderAddress,
        // eslint-disable-next-line @typescript-eslint/camelcase
        code_id: new Uint53(codeId).toString(),
        label: label,
        // eslint-disable-next-line @typescript-eslint/camelcase
        init_msg: initMsg,
        // eslint-disable-next-line @typescript-eslint/camelcase
        init_funds: options.transferAmount || [],
        admin: options.admin,
      },
    };
    const memo = options.memo || "";
    const fee = this.fees.init;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([instantiateMsg], fee, chainId, memo, accountNumber, sequence);

    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [instantiateMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
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
      type: "wasm/update-contract-admin",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        // eslint-disable-next-line @typescript-eslint/camelcase
        new_admin: newAdmin,
      },
    };
    const fee = this.fees.changeAdmin;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([updateAdminMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [updateAdminMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async clearAdmin(contractAddress: string, memo = ""): Promise<ChangeAdminResult> {
    const clearAdminMsg: MsgClearAdmin = {
      type: "wasm/clear-contract-admin",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
      },
    };
    const fee = this.fees.changeAdmin;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([clearAdminMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [clearAdminMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async migrate(
    contractAddress: string,
    codeId: number,
    migrateMsg: object,
    memo = "",
  ): Promise<MigrateResult> {
    const msg: MsgMigrateContract = {
      type: "wasm/migrate",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        // eslint-disable-next-line @typescript-eslint/camelcase
        code_id: new Uint53(codeId).toString(),
        msg: migrateMsg,
      },
    };
    const fee = this.fees.migrate;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([msg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [msg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
    }
    return {
      logs: result.logs,
      transactionHash: result.transactionHash,
    };
  }

  public async execute(
    contractAddress: string,
    handleMsg: object,
    memo = "",
    transferAmount?: readonly Coin[],
  ): Promise<ExecuteResult> {
    const executeMsg: MsgExecuteContract = {
      type: "wasm/execute",
      value: {
        sender: this.senderAddress,
        contract: contractAddress,
        msg: handleMsg,
        // eslint-disable-next-line @typescript-eslint/camelcase
        sent_funds: transferAmount || [],
      },
    };
    const fee = this.fees.exec;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([executeMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [executeMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    const result = await this.postTx(signedTx);
    if (isPostTxFailure(result)) {
      throw new Error(createPostTxErrorMessage(result));
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
  ): Promise<PostTxResult> {
    const sendMsg: MsgSend = {
      type: "cosmos-sdk/MsgSend",
      value: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        from_address: this.senderAddress,
        // eslint-disable-next-line @typescript-eslint/camelcase
        to_address: recipientAddress,
        amount: transferAmount,
      },
    };
    const fee = this.fees.send;
    const { accountNumber, sequence } = await this.getNonce();
    const chainId = await this.getChainId();
    const signBytes = makeSignBytes([sendMsg], fee, chainId, memo, accountNumber, sequence);
    const signature = await this.signCallback(signBytes);
    const signedTx: StdTx = {
      msg: [sendMsg],
      fee: fee,
      memo: memo,
      signatures: [signature],
    };

    return this.postTx(signedTx);
  }
}
