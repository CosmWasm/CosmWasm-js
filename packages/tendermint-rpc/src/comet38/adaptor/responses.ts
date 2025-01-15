/* eslint-disable @typescript-eslint/naming-convention */
import { fromBase64, fromHex } from "@cosmjs/encoding";
import { JsonRpcSuccessResponse } from "@cosmjs/json-rpc";
import { assert } from "@cosmjs/utils";

import { fromRfc3339WithNanoseconds } from "../../dates";
import { apiToBigInt, apiToSmallInt } from "../../inthelpers";
import { SubscriptionEvent } from "../../rpcclients";
import { BlockIdFlag, CommitSignature, ValidatorPubkey } from "../../types";
import {
  assertArray,
  assertBoolean,
  assertNotEmpty,
  assertNumber,
  assertObject,
  assertSet,
  assertString,
  dictionaryToStringMap,
  may,
} from "../encodings";
import { hashTx } from "../hasher";
import * as responses from "../responses";

interface AbciInfoResult {
  readonly response: RpcAbciInfoResponse;
}

interface RpcAbciInfoResponse {
  readonly data?: string;
  readonly last_block_height?: string;
  /** base64 encoded */
  readonly last_block_app_hash?: string;
}

function decodeAbciInfo(data: RpcAbciInfoResponse): responses.AbciInfoResponse {
  return {
    data: data.data,
    lastBlockHeight: may(apiToSmallInt, data.last_block_height),
    lastBlockAppHash: may(fromBase64, data.last_block_app_hash),
  };
}

interface AbciQueryResult {
  readonly response: RpcAbciQueryResponse;
}

export interface RpcProofOp {
  readonly type: string;
  /** base64 encoded */
  readonly key: string;
  /** base64 encoded */
  readonly data: string;
}

export interface RpcQueryProof {
  readonly ops: readonly RpcProofOp[];
}

function decodeQueryProof(data: RpcQueryProof): responses.QueryProof {
  return {
    ops: data.ops.map((op) => ({
      type: op.type,
      key: fromBase64(op.key),
      data: fromBase64(op.data),
    })),
  };
}

interface RpcAbciQueryResponse {
  /**
   * Base64 encoded
   *
   * This can be null since this is a byte slice and due to
   * https://github.com/tendermint/tendermint/blob/v0.35.7/abci/types/result.go#L53
   */
  readonly key?: string | null;
  /**
   * Base64 encoded
   *
   * This can be null since this is a byte slice and due to
   * https://github.com/tendermint/tendermint/blob/v0.35.7/abci/types/result.go#L53
   */
  readonly value?: string | null;
  readonly proofOps?: RpcQueryProof | null;
  readonly height?: string;
  readonly index?: string;
  readonly code?: string; // only for errors
  readonly codespace?: string;
  readonly log?: string;
  readonly info?: string;
}

function decodeAbciQuery(data: RpcAbciQueryResponse): responses.AbciQueryResponse {
  return {
    key: fromBase64(assertString(data.key ?? "")),
    value: fromBase64(assertString(data.value ?? "")),
    proof: may(decodeQueryProof, data.proofOps),
    height: may(apiToSmallInt, data.height),
    code: may(apiToSmallInt, data.code),
    codespace: assertString(data.codespace ?? ""),
    index: may(apiToSmallInt, data.index),
    log: data.log,
    info: assertString(data.info ?? ""),
  };
}

/**
 * EventAttribute from Tendermint. In 0.35 the type of key and value was changed
 * from bytes to string, such that no base64 encoding is used anymore.
 */
interface RpcEventAttribute {
  readonly key: string;
  readonly value?: string;
}

function decodeEventAttribute(attribute: RpcEventAttribute): responses.EventAttribute {
  return {
    key: assertNotEmpty(attribute.key),
    value: attribute.value ?? "",
  };
}

function decodeAttributes(attributes: readonly RpcEventAttribute[]): responses.EventAttribute[] {
  return assertArray(attributes).map(decodeEventAttribute);
}

interface RpcEvent {
  readonly type: string;
  /** Can be omitted (see https://github.com/cosmos/cosmjs/pull/1198) */
  readonly attributes?: readonly RpcEventAttribute[];
}

export function decodeEvent(event: RpcEvent): responses.Event {
  return {
    type: event.type,
    attributes: event.attributes ? decodeAttributes(event.attributes) : [],
  };
}

function decodeEvents(events: readonly RpcEvent[]): readonly responses.Event[] {
  return assertArray(events).map(decodeEvent);
}

interface RpcTxData {
  readonly codespace?: string;
  readonly code?: number;
  readonly log?: string;
  /** base64 encoded */
  readonly data?: string;
  readonly events?: readonly RpcEvent[];
  readonly gas_wanted?: string;
  readonly gas_used?: string;
}

function decodeTxData(data: RpcTxData): responses.TxData {
  return {
    code: apiToSmallInt(assertNumber(data.code ?? 0)),
    codespace: data.codespace,
    log: data.log,
    data: may(fromBase64, data.data),
    events: data.events ? decodeEvents(data.events) : [],
    gasWanted: apiToBigInt(data.gas_wanted ?? "0"),
    gasUsed: apiToBigInt(data.gas_used ?? "0"),
  };
}

type RpcPubkey =
  | {
      readonly type: string;
      /** base64 encoded */
      readonly value: string;
    }
  | {
      // See: https://github.com/cosmos/cosmjs/issues/1142
      readonly Sum: {
        readonly type: string;
        readonly value: {
          /** base64 encoded */
          [algorithm: string]: string;
        };
      };
    };

function decodePubkey(data: RpcPubkey): ValidatorPubkey {
  if ("Sum" in data) {
    // we don't need to check type because we're checking algorithm
    const [[algorithm, value]] = Object.entries(data.Sum.value);
    assert(algorithm === "ed25519" || algorithm === "secp256k1", `unknown pubkey type: ${algorithm}`);
    return {
      algorithm,
      data: fromBase64(assertNotEmpty(value)),
    };
  } else {
    switch (data.type) {
      // go-amino special code
      case "tendermint/PubKeyEd25519":
        return {
          algorithm: "ed25519",
          data: fromBase64(assertNotEmpty(data.value)),
        };
      case "tendermint/PubKeySecp256k1":
        return {
          algorithm: "secp256k1",
          data: fromBase64(assertNotEmpty(data.value)),
        };
      default:
        throw new Error(`unknown pubkey type: ${data.type}`);
    }
  }
}

interface RpcBlockParams {
  readonly max_bytes: string;
  readonly max_gas: string;
}

/**
 * Note: we do not parse block.time_iota_ms for now because of this CHANGELOG entry
 *
 * > Add time_iota_ms to block's consensus parameters (not exposed to the application)
 * https://github.com/tendermint/tendermint/blob/master/CHANGELOG.md#v0310
 */
function decodeBlockParams(data: RpcBlockParams): responses.BlockParams {
  return {
    maxBytes: apiToSmallInt(assertNotEmpty(data.max_bytes)),
    maxGas: apiToSmallInt(assertNotEmpty(data.max_gas)),
  };
}

interface RpcEvidenceParams {
  readonly max_age_num_blocks: string;
  readonly max_age_duration: string;
}

function decodeEvidenceParams(data: RpcEvidenceParams): responses.EvidenceParams {
  return {
    maxAgeNumBlocks: apiToSmallInt(assertNotEmpty(data.max_age_num_blocks)),
    maxAgeDuration: apiToSmallInt(assertNotEmpty(data.max_age_duration)),
  };
}

/**
 * Example data:
 * {
 *   "block": {
 *     "max_bytes": "22020096",
 *     "max_gas": "-1",
 *     "time_iota_ms": "1000"
 *   },
 *   "evidence": {
 *     "max_age_num_blocks": "100000",
 *     "max_age_duration": "172800000000000"
 *   },
 *   "validator": {
 *     "pub_key_types": [
 *       "ed25519"
 *     ]
 *   }
 * }
 */
interface RpcConsensusParams {
  readonly block: RpcBlockParams;
  readonly evidence: RpcEvidenceParams;
}

function decodeConsensusParams(data: RpcConsensusParams): responses.ConsensusParams {
  return {
    block: decodeBlockParams(assertObject(data.block)),
    evidence: decodeEvidenceParams(assertObject(data.evidence)),
  };
}

// for block results
interface RpcValidatorUpdate {
  readonly pub_key: RpcPubkey;
  // When omitted, this means zero (see https://github.com/cosmos/cosmjs/issues/1177#issuecomment-1160115080)
  readonly power?: string;
}

export function decodeValidatorUpdate(data: RpcValidatorUpdate): responses.ValidatorUpdate {
  return {
    pubkey: decodePubkey(assertObject(data.pub_key)),
    votingPower: apiToBigInt(data.power ?? "0"),
  };
}

interface RpcBlockResultsResponse {
  readonly height: string;
  readonly txs_results: readonly RpcTxData[] | null;
  readonly finalize_block_events: readonly RpcEvent[] | null;
  readonly validator_updates: readonly RpcValidatorUpdate[] | null;
  readonly consensus_param_updates: RpcConsensusParams | null;
}

function decodeBlockResults(data: RpcBlockResultsResponse): responses.BlockResultsResponse {
  return {
    height: apiToSmallInt(assertNotEmpty(data.height)),
    results: (data.txs_results || []).map(decodeTxData),
    validatorUpdates: (data.validator_updates || []).map(decodeValidatorUpdate),
    consensusUpdates: may(decodeConsensusParams, data.consensus_param_updates),
    finalizeBlockEvents: decodeEvents(data.finalize_block_events || [])
  };
}

interface RpcBlockId {
  /** hex encoded */
  readonly hash: string;
  readonly parts: {
    readonly total: number;
    /** hex encoded */
    readonly hash: string;
  };
}

function decodeBlockId(data: RpcBlockId): responses.BlockId {
  return {
    hash: fromHex(assertNotEmpty(data.hash)),
    parts: {
      total: assertNotEmpty(data.parts.total),
      hash: fromHex(assertNotEmpty(data.parts.hash)),
    },
  };
}

interface RpcBlockVersion {
  readonly block: string;
  readonly app?: string;
}

function decodeBlockVersion(data: RpcBlockVersion): responses.Version {
  return {
    block: apiToSmallInt(data.block),
    app: apiToSmallInt(data.app ?? 0),
  };
}

interface RpcHeader {
  readonly version: RpcBlockVersion;
  readonly chain_id: string;
  readonly height: string;
  readonly time: string;

  readonly last_block_id: RpcBlockId;

  /** hex encoded */
  readonly last_commit_hash: string;
  /** hex encoded */
  readonly data_hash: string;

  /** hex encoded */
  readonly validators_hash: string;
  /** hex encoded */
  readonly next_validators_hash: string;
  /** hex encoded */
  readonly consensus_hash: string;
  /** hex encoded */
  readonly app_hash: string;
  /** hex encoded */
  readonly last_results_hash: string;

  /** hex encoded */
  readonly evidence_hash: string;
  /** hex encoded */
  readonly proposer_address: string;
}

function decodeHeader(data: RpcHeader): responses.Header {
  return {
    version: decodeBlockVersion(data.version),
    chainId: assertNotEmpty(data.chain_id),
    height: apiToSmallInt(assertNotEmpty(data.height)),
    time: fromRfc3339WithNanoseconds(assertNotEmpty(data.time)),

    // When there is no last block ID (i.e. this block's height is 1), we get an empty structure like this:
    // { hash: '', parts: { total: 0, hash: '' } }
    lastBlockId: data.last_block_id.hash ? decodeBlockId(data.last_block_id) : null,

    lastCommitHash: fromHex(assertSet(data.last_commit_hash)),
    dataHash: fromHex(assertSet(data.data_hash)),

    validatorsHash: fromHex(assertSet(data.validators_hash)),
    nextValidatorsHash: fromHex(assertSet(data.next_validators_hash)),
    consensusHash: fromHex(assertSet(data.consensus_hash)),
    appHash: fromHex(assertSet(data.app_hash)),
    lastResultsHash: fromHex(assertSet(data.last_results_hash)),

    evidenceHash: fromHex(assertSet(data.evidence_hash)),
    proposerAddress: fromHex(assertNotEmpty(data.proposer_address)),
  };
}

interface RpcBlockMeta {
  readonly block_id: RpcBlockId;
  readonly block_size: string;
  readonly header: RpcHeader;
  readonly num_txs: string;
}

function decodeBlockMeta(data: RpcBlockMeta): responses.BlockMeta {
  return {
    blockId: decodeBlockId(data.block_id),
    blockSize: apiToSmallInt(assertNotEmpty(data.block_size)),
    header: decodeHeader(data.header),
    numTxs: apiToSmallInt(assertNotEmpty(data.num_txs)),
  };
}

interface RpcBlockchainResponse {
  readonly last_height: string;
  readonly block_metas: readonly RpcBlockMeta[];
}

function decodeBlockchain(data: RpcBlockchainResponse): responses.BlockchainResponse {
  return {
    lastHeight: apiToSmallInt(assertNotEmpty(data.last_height)),
    blockMetas: assertArray(data.block_metas).map(decodeBlockMeta),
  };
}

interface RpcBroadcastTxSyncResponse extends RpcTxData {
  /** hex encoded */
  readonly hash: string;
}

function decodeBroadcastTxSync(data: RpcBroadcastTxSyncResponse): responses.BroadcastTxSyncResponse {
  return {
    ...decodeTxData(data),
    hash: fromHex(assertNotEmpty(data.hash)),
  };
}

interface RpcBroadcastTxCommitResponse {
  readonly height: string;
  /** hex encoded */
  readonly hash: string;
  readonly check_tx: RpcTxData;
  readonly tx_result?: RpcTxData;
}

function decodeBroadcastTxCommit(data: RpcBroadcastTxCommitResponse): responses.BroadcastTxCommitResponse {
  const txResult = data.tx_result ? decodeTxData(data.tx_result) : undefined;
  return {
    height: apiToSmallInt(data.height),
    hash: fromHex(assertNotEmpty(data.hash)),
    checkTx: decodeTxData(assertObject(data.check_tx)),
    deliverTx: txResult,
    txResult: txResult,
  };
}

function decodeBlockIdFlag(blockIdFlag: number): BlockIdFlag {
  assert(blockIdFlag in BlockIdFlag);
  return blockIdFlag;
}

type RpcSignature = {
  readonly block_id_flag: number;
  /** hex encoded */
  readonly validator_address: string;
  readonly timestamp: string;
  /**
   * Base64 encoded signature.
   * There are cases when this is not set, see https://github.com/cosmos/cosmjs/issues/704#issuecomment-797122415.
   */
  readonly signature: string | null;
};

function decodeCommitSignature(data: RpcSignature): CommitSignature {
  return {
    blockIdFlag: decodeBlockIdFlag(data.block_id_flag),
    validatorAddress: data.validator_address ? fromHex(data.validator_address) : undefined,
    timestamp: data.timestamp ? fromRfc3339WithNanoseconds(data.timestamp) : undefined,
    signature: data.signature ? fromBase64(data.signature) : undefined,
  };
}

interface RpcCommit {
  readonly block_id: RpcBlockId;
  readonly height: string;
  readonly round: string;
  readonly signatures: readonly RpcSignature[];
}

function decodeCommit(data: RpcCommit): responses.Commit {
  return {
    blockId: decodeBlockId(assertObject(data.block_id)),
    height: apiToSmallInt(assertNotEmpty(data.height)),
    round: apiToSmallInt(data.round),
    signatures: assertArray(data.signatures).map(decodeCommitSignature),
  };
}

interface RpcCommitResponse {
  readonly signed_header: {
    readonly header: RpcHeader;
    readonly commit: RpcCommit;
  };
  readonly canonical: boolean;
}

function decodeCommitResponse(data: RpcCommitResponse): responses.CommitResponse {
  return {
    canonical: assertBoolean(data.canonical),
    header: decodeHeader(data.signed_header.header),
    commit: decodeCommit(data.signed_header.commit),
  };
}

interface RpcValidatorGenesis {
  /** hex-encoded */
  readonly address: string;
  readonly pub_key: RpcPubkey;
  readonly power: string;
  readonly name?: string;
}

export function decodeValidatorGenesis(data: RpcValidatorGenesis): responses.Validator {
  return {
    address: fromHex(assertNotEmpty(data.address)),
    pubkey: decodePubkey(assertObject(data.pub_key)),
    votingPower: apiToBigInt(assertNotEmpty(data.power)),
  };
}

interface RpcGenesisResponse {
  readonly genesis_time: string;
  readonly chain_id: string;
  readonly consensus_params: RpcConsensusParams;
  // The validators key is used to specify a set of validators for testnets or PoA blockchains.
  // PoS blockchains use the app_state.genutil.gentxs field to stake and bond a number of validators in the first block.
  readonly validators?: readonly RpcValidatorGenesis[];
  /** hex encoded */
  readonly app_hash: string;
  readonly app_state: Record<string, unknown> | undefined;
}

interface GenesisResult {
  readonly genesis: RpcGenesisResponse;
}

function decodeGenesis(data: RpcGenesisResponse): responses.GenesisResponse {
  return {
    genesisTime: fromRfc3339WithNanoseconds(assertNotEmpty(data.genesis_time)),
    chainId: assertNotEmpty(data.chain_id),
    consensusParams: decodeConsensusParams(data.consensus_params),
    validators: data.validators ? assertArray(data.validators).map(decodeValidatorGenesis) : [],
    appHash: fromHex(assertSet(data.app_hash)), // empty string in kvstore app
    appState: data.app_state,
  };
}

// this is in status
interface RpcValidatorInfo {
  /** hex encoded */
  readonly address: string;
  readonly pub_key: RpcPubkey;
  readonly voting_power: string;
  readonly proposer_priority?: string;
}

export function decodeValidatorInfo(data: RpcValidatorInfo): responses.Validator {
  return {
    pubkey: decodePubkey(assertObject(data.pub_key)),
    votingPower: apiToBigInt(assertNotEmpty(data.voting_power)),
    address: fromHex(assertNotEmpty(data.address)),
    proposerPriority: data.proposer_priority ? apiToSmallInt(data.proposer_priority) : undefined,
  };
}

interface RpcNodeInfo {
  /** hex encoded */
  readonly id: string;
  /** IP and port */
  readonly listen_addr: string;
  readonly network: string;
  readonly version: string;
  readonly channels: string; // ???
  readonly moniker: string;
  readonly protocol_version: {
    readonly p2p: string;
    readonly block: string;
    readonly app: string;
  };
  /**
   * Additional information. E.g.
   * {
   *   "tx_index": "on",
   *   "rpc_address":"tcp://0.0.0.0:26657"
   * }
   */
  readonly other: Record<string, unknown>;
}

function decodeNodeInfo(data: RpcNodeInfo): responses.NodeInfo {
  return {
    id: fromHex(assertNotEmpty(data.id)),
    listenAddr: assertNotEmpty(data.listen_addr),
    network: assertNotEmpty(data.network),
    version: assertString(data.version), // Can be empty (https://github.com/cosmos/cosmos-sdk/issues/7963)
    channels: assertString(data.channels), // can be empty
    moniker: assertNotEmpty(data.moniker),
    other: dictionaryToStringMap(data.other),
    protocolVersion: {
      app: apiToSmallInt(assertNotEmpty(data.protocol_version.app)),
      block: apiToSmallInt(assertNotEmpty(data.protocol_version.block)),
      p2p: apiToSmallInt(assertNotEmpty(data.protocol_version.p2p)),
    },
  };
}

interface RpcSyncInfo {
  /** hex encoded */
  readonly earliest_app_hash: string;
  /** hex encoded */
  readonly earliest_block_hash: string;
  readonly earliest_block_height: string;
  readonly earliest_block_time: string;
  /** hex encoded */
  readonly latest_block_hash: string;
  /** hex encoded */
  readonly latest_app_hash: string;
  readonly latest_block_height: string;
  readonly latest_block_time: string;
  readonly catching_up: boolean;
}

function decodeSyncInfo(data: RpcSyncInfo): responses.SyncInfo {
  const earliestBlockHeight = data.earliest_block_height
    ? apiToSmallInt(data.earliest_block_height)
    : undefined;
  const earliestBlockTime = data.earliest_block_time
    ? fromRfc3339WithNanoseconds(data.earliest_block_time)
    : undefined;

  return {
    earliestAppHash: data.earliest_app_hash ? fromHex(data.earliest_app_hash) : undefined,
    earliestBlockHash: data.earliest_block_hash ? fromHex(data.earliest_block_hash) : undefined,
    earliestBlockHeight: earliestBlockHeight || undefined,
    earliestBlockTime: earliestBlockTime?.getTime() ? earliestBlockTime : undefined,
    latestBlockHash: fromHex(assertNotEmpty(data.latest_block_hash)),
    latestAppHash: fromHex(assertNotEmpty(data.latest_app_hash)),
    latestBlockTime: fromRfc3339WithNanoseconds(assertNotEmpty(data.latest_block_time)),
    latestBlockHeight: apiToSmallInt(assertNotEmpty(data.latest_block_height)),
    catchingUp: assertBoolean(data.catching_up),
  };
}

interface RpcStatusResponse {
  readonly node_info: RpcNodeInfo;
  readonly sync_info: RpcSyncInfo;
  readonly validator_info: RpcValidatorInfo;
}

function decodeStatus(data: RpcStatusResponse): responses.StatusResponse {
  return {
    nodeInfo: decodeNodeInfo(data.node_info),
    syncInfo: decodeSyncInfo(data.sync_info),
    validatorInfo: decodeValidatorInfo(data.validator_info),
  };
}

/**
 * Example data:
 * {
 *   "root_hash": "10A1A17D5F818099B5CAB5B91733A3CC27C0DB6CE2D571AC27FB970C314308BB",
 *   "data": "ZVlERVhDV2lVNEUwPXhTUjc4Tmp2QkNVSg==",
 *   "proof": {
 *     "total": "1",
 *     "index": "0",
 *     "leaf_hash": "EKGhfV+BgJm1yrW5FzOjzCfA22zi1XGsJ/uXDDFDCLs=",
 *     "aunts": []
 *   }
 * }
 */
interface RpcTxProof {
  /** base64 encoded */
  readonly data: string;
  /** hex encoded */
  readonly root_hash: string;
  readonly proof: {
    readonly total: string;
    readonly index: string;
    /** base64 encoded */
    readonly leaf_hash: string;
    /** base64 encoded */
    readonly aunts: readonly string[];
  };
}

function decodeTxProof(data: RpcTxProof): responses.TxProof {
  return {
    data: fromBase64(assertNotEmpty(data.data)),
    rootHash: fromHex(assertNotEmpty(data.root_hash)),
    proof: {
      total: apiToSmallInt(assertNotEmpty(data.proof.total)),
      index: apiToSmallInt(assertNotEmpty(data.proof.index)),
      leafHash: fromBase64(assertNotEmpty(data.proof.leaf_hash)),
      aunts: assertArray(data.proof.aunts).map(fromBase64),
    },
  };
}

interface RpcTxResponse {
  /** Raw tx bytes, base64 encoded */
  readonly tx: string;
  readonly tx_result: RpcTxData;
  readonly height: string;
  readonly index: number;
  /** hex encoded */
  readonly hash: string;
  readonly proof?: RpcTxProof;
}

function decodeTxResponse(data: RpcTxResponse): responses.TxResponse {
  return {
    tx: fromBase64(assertNotEmpty(data.tx)),
    result: decodeTxData(assertObject(data.tx_result)),
    height: apiToSmallInt(assertNotEmpty(data.height)),
    index: apiToSmallInt(assertNumber(data.index)),
    hash: fromHex(assertNotEmpty(data.hash)),
    proof: may(decodeTxProof, data.proof),
  };
}

interface RpcTxSearchResponse {
  readonly txs: readonly RpcTxResponse[];
  readonly total_count: string;
}

function decodeTxSearch(data: RpcTxSearchResponse): responses.TxSearchResponse {
  return {
    totalCount: apiToSmallInt(assertNotEmpty(data.total_count)),
    txs: assertArray(data.txs).map(decodeTxResponse),
  };
}

interface RpcTxEvent {
  /** Raw tx bytes, base64 encoded */
  readonly tx: string;
  readonly result: RpcTxData;
  readonly height: string;
}

function decodeTxEvent(data: RpcTxEvent): responses.TxEvent {
  const tx = fromBase64(assertNotEmpty(data.tx));
  return {
    tx: tx,
    hash: hashTx(tx),
    result: decodeTxData(data.result),
    height: apiToSmallInt(assertNotEmpty(data.height)),
  };
}

interface RpcValidatorsResponse {
  readonly block_height: string;
  readonly validators: readonly RpcValidatorInfo[];
  readonly count: string;
  readonly total: string;
}

function decodeValidators(data: RpcValidatorsResponse): responses.ValidatorsResponse {
  return {
    blockHeight: apiToSmallInt(assertNotEmpty(data.block_height)),
    validators: assertArray(data.validators).map(decodeValidatorInfo),
    count: apiToSmallInt(assertNotEmpty(data.count)),
    total: apiToSmallInt(assertNotEmpty(data.total)),
  };
}

// We lost track on how the evidence structure actually looks like.
// This is any now and passed to the caller untouched.
type RpcEvidence = any;

interface RpcBlock {
  readonly header: RpcHeader;
  readonly last_commit: RpcCommit;
  readonly data: {
    /** Raw tx bytes, base64 encoded */
    readonly txs?: readonly string[];
  };
  // It's currently unclear why the deep nesting is requied.
  // See https://github.com/tendermint/tendermint/issues/7697.
  readonly evidence?: {
    readonly evidence?: readonly RpcEvidence[];
  };
}

function decodeBlock(data: RpcBlock): responses.Block {
  return {
    header: decodeHeader(assertObject(data.header)),
    // For the block at height 1, last commit is not set. This is represented in an empty object like this:
    // { height: '0', round: 0, block_id: { hash: '', parts: [Object] }, signatures: [] }
    lastCommit: data.last_commit.block_id.hash ? decodeCommit(assertObject(data.last_commit)) : null,
    txs: data.data.txs ? assertArray(data.data.txs).map(fromBase64) : [],
    // Lift up .evidence.evidence to just .evidence
    // See https://github.com/tendermint/tendermint/issues/7697
    evidence: data.evidence?.evidence ?? [],
  };
}

interface RpcBlockResponse {
  readonly block_id: RpcBlockId;
  readonly block: RpcBlock;
}

function decodeBlockResponse(data: RpcBlockResponse): responses.BlockResponse {
  return {
    blockId: decodeBlockId(data.block_id),
    block: decodeBlock(data.block),
  };
}

interface RpcBlockSearchResponse {
  readonly blocks: readonly RpcBlockResponse[];
  readonly total_count: string;
}

function decodeBlockSearch(data: RpcBlockSearchResponse): responses.BlockSearchResponse {
  return {
    totalCount: apiToSmallInt(assertNotEmpty(data.total_count)),
    blocks: assertArray(data.blocks).map(decodeBlockResponse),
  };
}

interface RpcNumUnconfirmedTxsResponse {
  readonly total: string;
  readonly total_bytes: string;
}

function decodeNumUnconfirmedTxs(data: RpcNumUnconfirmedTxsResponse): responses.NumUnconfirmedTxsResponse {
  return {
    total: apiToSmallInt(assertNotEmpty(data.total)),
    totalBytes: apiToSmallInt(assertNotEmpty(data.total_bytes)),
  };
}

export class Responses {
  public static decodeAbciInfo(response: JsonRpcSuccessResponse): responses.AbciInfoResponse {
    return decodeAbciInfo(assertObject((response.result as AbciInfoResult).response));
  }

  public static decodeAbciQuery(response: JsonRpcSuccessResponse): responses.AbciQueryResponse {
    return decodeAbciQuery(assertObject((response.result as AbciQueryResult).response));
  }

  public static decodeBlock(response: JsonRpcSuccessResponse): responses.BlockResponse {
    return decodeBlockResponse(response.result as RpcBlockResponse);
  }

  public static decodeBlockResults(response: JsonRpcSuccessResponse): responses.BlockResultsResponse {
    return decodeBlockResults(response.result as RpcBlockResultsResponse);
  }

  public static decodeBlockSearch(response: JsonRpcSuccessResponse): responses.BlockSearchResponse {
    return decodeBlockSearch(response.result as RpcBlockSearchResponse);
  }

  public static decodeBlockchain(response: JsonRpcSuccessResponse): responses.BlockchainResponse {
    return decodeBlockchain(response.result as RpcBlockchainResponse);
  }

  public static decodeBroadcastTxSync(response: JsonRpcSuccessResponse): responses.BroadcastTxSyncResponse {
    return decodeBroadcastTxSync(response.result as RpcBroadcastTxSyncResponse);
  }

  public static decodeBroadcastTxAsync(response: JsonRpcSuccessResponse): responses.BroadcastTxAsyncResponse {
    return Responses.decodeBroadcastTxSync(response);
  }

  public static decodeBroadcastTxCommit(
    response: JsonRpcSuccessResponse,
  ): responses.BroadcastTxCommitResponse {
    return decodeBroadcastTxCommit(response.result as RpcBroadcastTxCommitResponse);
  }

  public static decodeCommit(response: JsonRpcSuccessResponse): responses.CommitResponse {
    return decodeCommitResponse(response.result as RpcCommitResponse);
  }

  public static decodeGenesis(response: JsonRpcSuccessResponse): responses.GenesisResponse {
    return decodeGenesis(assertObject((response.result as GenesisResult).genesis));
  }

  public static decodeHealth(): responses.HealthResponse {
    return null;
  }

  public static decodeNumUnconfirmedTxs(
    response: JsonRpcSuccessResponse,
  ): responses.NumUnconfirmedTxsResponse {
    return decodeNumUnconfirmedTxs(response.result as RpcNumUnconfirmedTxsResponse);
  }

  public static decodeStatus(response: JsonRpcSuccessResponse): responses.StatusResponse {
    return decodeStatus(response.result as RpcStatusResponse);
  }

  public static decodeNewBlockEvent(event: SubscriptionEvent): responses.NewBlockEvent {
    return decodeBlock(event.data.value.block as RpcBlock);
  }

  public static decodeNewBlockHeaderEvent(event: SubscriptionEvent): responses.NewBlockHeaderEvent {
    return decodeHeader(event.data.value.header as RpcHeader);
  }

  public static decodeTxEvent(event: SubscriptionEvent): responses.TxEvent {
    return decodeTxEvent(event.data.value.TxResult as RpcTxEvent);
  }

  public static decodeTx(response: JsonRpcSuccessResponse): responses.TxResponse {
    return decodeTxResponse(response.result as RpcTxResponse);
  }

  public static decodeTxSearch(response: JsonRpcSuccessResponse): responses.TxSearchResponse {
    return decodeTxSearch(response.result as RpcTxSearchResponse);
  }

  public static decodeValidators(response: JsonRpcSuccessResponse): responses.ValidatorsResponse {
    return decodeValidators(response.result as RpcValidatorsResponse);
  }
}
