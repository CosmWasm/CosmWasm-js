/* eslint-disable no-dupe-class-members, @typescript-eslint/ban-types, @typescript-eslint/naming-convention */
import { StdTx } from "@cosmjs/amino";
import { assert, isNonNullObject } from "@cosmjs/utils";
import axios, { AxiosError, AxiosInstance } from "axios";

import { WrappedStdTx } from "../tx";
import {
  BlockResponse,
  BroadcastMode,
  BroadcastTxsResponse,
  EncodeTxResponse,
  NodeInfoResponse,
  SearchTxsResponse,
  TxsResponse,
} from "./base";

/** Unfortunately, Cosmos SDK encodes empty arrays as null */
export type LcdApiArray<T> = readonly T[] | null;

export function normalizeLcdApiArray<T>(backend: LcdApiArray<T>): readonly T[] {
  return backend || [];
}

type LcdExtensionSetup<P> = (base: LcdClient) => P;

export interface LcdClientBaseOptions {
  readonly apiUrl: string;
  readonly broadcastMode?: BroadcastMode;
}

// We want to get message data from 500 errors
// https://stackoverflow.com/questions/56577124/how-to-handle-500-error-message-with-axios
// this should be chained to catch one error and throw a more informative one
function parseAxiosError(err: AxiosError): never {
  // use the error message sent from server, not default 500 msg
  if (err.response?.data) {
    let errorText: string;
    const data = err.response.data;
    // expect { error: string }, but otherwise dump
    if (data.error && typeof data.error === "string") {
      errorText = data.error;
    } else if (typeof data === "string") {
      errorText = data;
    } else {
      errorText = JSON.stringify(data);
    }
    throw new Error(`${errorText} (HTTP ${err.response.status})`);
  } else {
    throw err;
  }
}

/**
 * A client to the LCD's (light client daemon) API.
 * This light client connects to Tendermint (i.e. the chain), encodes/decodes Amino data for us and provides a convenient JSON interface.
 *
 * This _JSON over HTTP_ API is sometimes referred to as "REST" or "RPC", which are both misleading terms
 * for the same thing.
 *
 * Please note that the client to the LCD can not verify light client proofs. When using this,
 * you need to trust the API provider as well as the network connection between client and API.
 *
 * @see https://cosmos.network/rpc
 */
export class LcdClient {
  /** Constructs an LCD client with 0 extensions */
  public static withExtensions(options: LcdClientBaseOptions): LcdClient;

  /** Constructs an LCD client with 1 extension */
  public static withExtensions<A extends object>(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
  ): LcdClient & A;

  /** Constructs an LCD client with 2 extensions */
  public static withExtensions<A extends object, B extends object>(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
  ): LcdClient & A & B;

  /** Constructs an LCD client with 3 extensions */
  public static withExtensions<A extends object, B extends object, C extends object>(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
  ): LcdClient & A & B & C;

  /** Constructs an LCD client with 4 extensions */
  public static withExtensions<A extends object, B extends object, C extends object, D extends object>(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
    setupExtensionD: LcdExtensionSetup<D>,
  ): LcdClient & A & B & C & D;

  /** Constructs an LCD client with 5 extensions */
  public static withExtensions<
    A extends object,
    B extends object,
    C extends object,
    D extends object,
    E extends object,
  >(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
    setupExtensionD: LcdExtensionSetup<D>,
    setupExtensionE: LcdExtensionSetup<E>,
  ): LcdClient & A & B & C & D & E;

  /** Constructs an LCD client with 6 extensions */
  public static withExtensions<
    A extends object,
    B extends object,
    C extends object,
    D extends object,
    E extends object,
    F extends object,
  >(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
    setupExtensionD: LcdExtensionSetup<D>,
    setupExtensionE: LcdExtensionSetup<E>,
    setupExtensionF: LcdExtensionSetup<F>,
  ): LcdClient & A & B & C & D & E & F;

  /** Constructs an LCD client with 7 extensions */
  public static withExtensions<
    A extends object,
    B extends object,
    C extends object,
    D extends object,
    E extends object,
    F extends object,
    G extends object,
  >(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
    setupExtensionD: LcdExtensionSetup<D>,
    setupExtensionE: LcdExtensionSetup<E>,
    setupExtensionF: LcdExtensionSetup<F>,
    setupExtensionG: LcdExtensionSetup<G>,
  ): LcdClient & A & B & C & D & E & F & G;

  /** Constructs an LCD client with 8 extensions */
  public static withExtensions<
    A extends object,
    B extends object,
    C extends object,
    D extends object,
    E extends object,
    F extends object,
    G extends object,
    H extends object,
  >(
    options: LcdClientBaseOptions,
    setupExtensionA: LcdExtensionSetup<A>,
    setupExtensionB: LcdExtensionSetup<B>,
    setupExtensionC: LcdExtensionSetup<C>,
    setupExtensionD: LcdExtensionSetup<D>,
    setupExtensionE: LcdExtensionSetup<E>,
    setupExtensionF: LcdExtensionSetup<F>,
    setupExtensionG: LcdExtensionSetup<G>,
    setupExtensionH: LcdExtensionSetup<H>,
  ): LcdClient & A & B & C & D & E & F & G & H;

  public static withExtensions(
    options: LcdClientBaseOptions,
    ...extensionSetups: Array<LcdExtensionSetup<object>>
  ): any {
    const client = new LcdClient(options.apiUrl, options.broadcastMode);
    const extensions = extensionSetups.map((setupExtension) => setupExtension(client));
    for (const extension of extensions) {
      assert(isNonNullObject(extension), `Extension must be a non-null object`);
      for (const [moduleKey, moduleValue] of Object.entries(extension)) {
        assert(
          isNonNullObject(moduleValue),
          `Module must be a non-null object. Found type ${typeof moduleValue} for module "${moduleKey}".`,
        );
        const current = (client as any)[moduleKey] || {};
        (client as any)[moduleKey] = {
          ...current,
          ...moduleValue,
        };
      }
    }
    return client;
  }

  private readonly client: AxiosInstance;
  private readonly broadcastMode: BroadcastMode;

  /**
   * Creates a new client to interact with a Cosmos SDK light client daemon.
   * This class tries to be a direct mapping onto the API. Some basic decoding and normalizatin is done
   * but things like caching are done at a higher level.
   *
   * When building apps, you should not need to use this class directly. If you do, this indicates a missing feature
   * in higher level components. Feel free to raise an issue in this case.
   *
   * @param apiUrl The URL of a Cosmos SDK light client daemon API (sometimes called REST server or REST API)
   * @param broadcastMode Defines at which point of the transaction processing the broadcastTx method returns
   */
  public constructor(apiUrl: string, broadcastMode = BroadcastMode.Block) {
    const headers = {
      post: { "Content-Type": "application/json" },
    };
    this.client = axios.create({
      baseURL: apiUrl,
      headers: headers,
    });
    this.broadcastMode = broadcastMode;
  }

  public async get(path: string, params?: Record<string, any>): Promise<any> {
    const { data } = await this.client.get(path, { params }).catch(parseAxiosError);
    if (data === null) {
      throw new Error("Received null response from server");
    }
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async post(path: string, params: any): Promise<any> {
    if (!isNonNullObject(params)) throw new Error("Got unexpected type of params. Expected object.");
    const { data } = await this.client.post(path, params).catch(parseAxiosError);
    if (data === null) {
      throw new Error("Received null response from server");
    }
    return data;
  }

  // The /blocks endpoints

  public async blocksLatest(): Promise<BlockResponse> {
    const responseData = await this.get("/blocks/latest");
    if (!responseData.block) {
      throw new Error("Unexpected response data format");
    }
    return responseData as BlockResponse;
  }

  public async blocks(height: number): Promise<BlockResponse> {
    const responseData = await this.get(`/blocks/${height}`);
    if (!responseData.block) {
      throw new Error("Unexpected response data format");
    }
    return responseData as BlockResponse;
  }

  // The /node_info endpoint

  public async nodeInfo(): Promise<NodeInfoResponse> {
    const responseData = await this.get("/node_info");
    if (!responseData.node_info) {
      throw new Error("Unexpected response data format");
    }
    return responseData as NodeInfoResponse;
  }

  // The /txs endpoints

  public async txById(id: string): Promise<TxsResponse> {
    const responseData = await this.get(`/txs/${id}`);
    if (!responseData.tx) {
      throw new Error("Unexpected response data format");
    }
    return responseData as TxsResponse;
  }

  public async txsQuery(query: string): Promise<SearchTxsResponse> {
    const responseData = await this.get(`/txs?${query}`);
    if (!responseData.txs) {
      throw new Error("Unexpected response data format");
    }
    return responseData as SearchTxsResponse;
  }

  /** returns the amino-encoding of the transaction performed by the server */
  public async encodeTx(tx: WrappedStdTx): Promise<EncodeTxResponse> {
    const responseData = await this.post("/txs/encode", tx);
    if (!responseData.tx) {
      throw new Error("Unexpected response data format");
    }
    return responseData as EncodeTxResponse;
  }

  /**
   * Broadcasts a signed transaction to the transaction pool.
   * Depending on the client's broadcast mode, this might or might
   * wait for checkTx or deliverTx to be executed before returning.
   *
   * @param tx a signed transaction as StdTx (i.e. not wrapped in type/value container)
   */
  public async broadcastTx(tx: StdTx): Promise<BroadcastTxsResponse> {
    const params = {
      tx: tx,
      mode: this.broadcastMode,
    };
    const responseData = await this.post("/txs", params);
    if (!responseData.txhash) {
      throw new Error("Unexpected response data format");
    }
    return responseData as BroadcastTxsResponse;
  }
}
