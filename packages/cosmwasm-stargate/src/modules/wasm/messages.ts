import { toUtf8 } from "@cosmjs/encoding";
import { EncodeObject, GeneratedType } from "@cosmjs/proto-signing";
import { assert, isNonNullObject } from "@cosmjs/utils";
import {
  MsgClearAdmin,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgInstantiateContract2,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from "cosmjs-types/cosmwasm/wasm/v1/tx";
import Long from "long";

export const wasmTypes: ReadonlyArray<[string, GeneratedType]> = [
  ["/cosmwasm.wasm.v1.MsgClearAdmin", MsgClearAdmin],
  ["/cosmwasm.wasm.v1.MsgExecuteContract", MsgExecuteContract],
  ["/cosmwasm.wasm.v1.MsgMigrateContract", MsgMigrateContract],
  ["/cosmwasm.wasm.v1.MsgStoreCode", MsgStoreCode],
  ["/cosmwasm.wasm.v1.MsgInstantiateContract", MsgInstantiateContract],
  ["/cosmwasm.wasm.v1.MsgInstantiateContract2", MsgInstantiateContract2],
  ["/cosmwasm.wasm.v1.MsgUpdateAdmin", MsgUpdateAdmin],
];

export interface MsgStoreCodeEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode";
  readonly value: Partial<MsgStoreCode>;
}

export function isMsgStoreCodeEncodeObject(object: EncodeObject): object is MsgStoreCodeEncodeObject {
  return (object as MsgStoreCodeEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgStoreCode";
}

export interface MsgInstantiateContractEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract";
  readonly value: Partial<MsgInstantiateContract>;
}

export function isMsgInstantiateContractEncodeObject(
  object: EncodeObject,
): object is MsgInstantiateContractEncodeObject {
  return (
    (object as MsgInstantiateContractEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgInstantiateContract"
  );
}

export interface MsgInstantiateContract2EncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract2";
  readonly value: Partial<MsgInstantiateContract2>;
}

export function isMsgInstantiateContract2EncodeObject(
  object: EncodeObject,
): object is MsgInstantiateContract2EncodeObject {
  return (
    (object as MsgInstantiateContract2EncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgInstantiateContract2"
  );
}

export interface MsgUpdateAdminEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgUpdateAdmin";
  readonly value: Partial<MsgUpdateAdmin>;
}

export function isMsgUpdateAdminEncodeObject(object: EncodeObject): object is MsgUpdateAdminEncodeObject {
  return (object as MsgUpdateAdminEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgUpdateAdmin";
}

export interface MsgClearAdminEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgClearAdmin";
  readonly value: Partial<MsgClearAdmin>;
}

export function isMsgClearAdminEncodeObject(object: EncodeObject): object is MsgClearAdminEncodeObject {
  return (object as MsgClearAdminEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgClearAdmin";
}

export interface MsgMigrateContractEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgMigrateContract";
  readonly value: Partial<MsgMigrateContract>;
}

export function isMsgMigrateEncodeObject(object: EncodeObject): object is MsgMigrateContractEncodeObject {
  return (object as MsgMigrateContractEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgMigrateContract";
}

export interface MsgExecuteContractEncodeObject extends EncodeObject {
  readonly typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract";
  readonly value: Partial<MsgExecuteContract>;
}

export function isMsgExecuteEncodeObject(object: EncodeObject): object is MsgExecuteContractEncodeObject {
  return (object as MsgExecuteContractEncodeObject).typeUrl === "/cosmwasm.wasm.v1.MsgExecuteContract";
}

function getField(object: any, key: string | number): any {
  if (!(key in object)) throw new Error(`Missing key '${key}' in object`);
  return object[key];
}

function getStringField(object: any, key: string | number): string {
  const value = getField(object, key);
  if (typeof value !== "string") {
    throw new Error(`Wrong type for key '${key}' in object: ${typeof value}. Must be a string.`);
  }
  return value;
}

function getArrayField(object: any, key: string | number): any[] {
  const value = getField(object, key);
  if (!Array.isArray(value)) {
    throw new Error(`Wrong type for key '${key}' in object: ${typeof value}. Must be an array.`);
  }
  return value;
}

function importMsgExecuteContractEncodeObject(object: unknown): MsgExecuteContractEncodeObject {
  assert(isNonNullObject(object));
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender: getStringField(object, "sender"),
      contract: getStringField(object, "contract"),
      msg: toUtf8(JSON.stringify(getField(object, "msg"))),
      funds: getArrayField(object, "funds"),
    }),
  };
}

function importMsgInstantiateContract(object: unknown): MsgInstantiateContractEncodeObject {
  assert(isNonNullObject(object));
  return {
    typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
    value: MsgInstantiateContract.fromPartial({
      sender: getStringField(object, "sender"),
      admin: getStringField(object, "admin"),
      codeId: Long.fromString(getStringField(object, "code_id"), true, 10),
      label: getStringField(object, "label"),
      msg: toUtf8(JSON.stringify(getField(object, "msg"))),
      funds: getArrayField(object, "funds"),
    }),
  };
}

/**
 * Takes a JSON representation of the Go implementation and imports it into CosmJS types
 *
 * The Go JSON and the ts-proto JSON are not compatible, i.e. we have to implement every
 * message individually.
 */
export function importWasmMessages(
  json: string,
): Array<MsgExecuteContractEncodeObject | MsgInstantiateContractEncodeObject> {
  const doc = JSON.parse(json);
  if (!Array.isArray(doc)) throw new Error("Array expected");
  const out = [];
  for (const element of doc) {
    if (!isNonNullObject(element)) throw new Error("Element must be an object");
    const typeUrl = getStringField(element, "@type");
    switch (typeUrl) {
      case "/cosmwasm.wasm.v1.MsgExecuteContract":
        out.push(importMsgExecuteContractEncodeObject(element));
        break;
      case "/cosmwasm.wasm.v1.MsgInstantiateContract":
        out.push(importMsgInstantiateContract(element));
        break;
      default:
        throw new Error(`Unsupported message type '${typeUrl}' found.`);
    }
  }
  return out;
}
