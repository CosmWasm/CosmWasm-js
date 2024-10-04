# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- @cosmjs/cosmwasm-stargate: Added the ability to specify a custom account parser for `CosmWasmClient`

## [0.32.4] - 2024-06-26

### Fixed

- @cosmjs/tendermint-rpc: fix node info check to accept empty string on channels
  field ([#1591])

### Added

- @cosmjs/stargate: Add support for `MsgCancelUnbondingDelegation` ([#1535])

[#1535]: https://github.com/cosmos/cosmjs/pull/1535

### Changed

- @cosmjs/stargate, @cosmjs/cosmwasm-stargate: Synchronize the default gas
  multiplier value between the `signAndBroadcast` and `signAndBroadcastSync`
  methods so that it is equal to 1.4 everywhere. ([#1584])

## [0.32.3] - 2024-03-08

### Changed

- @cosmjs/amino: Add IBC denom support to `parseCoins` and use the same
  implementation in all those imports:

  ```ts
  import { parseCoins } from "@cosmjs/proto-signing";
  // equals
  import { parseCoins } from "@cosmjs/stargate";
  // equals
  import { parseCoins } from "@cosmjs/amino";
  ```

- @cosmjs/stargate: Let `parseRawLog` gracefully handle empty strings to better
  support Cosmos SDK 0.50 inputs. ([#1564])

[#1564]: https://github.com/cosmos/cosmjs/pull/1564

### Fixed

- @cosmjs/encoding: Avoid using replacement character in doc comment to make
  external tools happy. ([#1570])
- @cosmjs/cosmwasm-stargate: Use events instead of log parsing to receive
  information in SigningCosmWasmClient. This is required to support Cosmos SDK
  0.50+ where the `rawLog` field is empty. ([#1564])

[#1564]: https://github.com/cosmos/cosmjs/pull/1564
[#1570]: https://github.com/cosmos/cosmjs/pull/1570

## [0.32.2] - 2023-12-19

### Fixed

- @cosmjs/stargate: Update validation of `GasPrice.fromString` to allow using
  IBC denoms as gas denom. ([#1522])

[#1522]: https://github.com/cosmos/cosmjs/pull/1522

### Changed

- @cosmjs/tendermint-rpc: Require protocol to be set in endpoint URLs (https://,
  http://, wss:// or ws://). Otherwise an error is raised instead of falling
  back to ws://. ([#1527])

[#1527]: https://github.com/cosmos/cosmjs/pull/1527

## [0.32.1] - 2023-12-04

### Fixed

- @cosmjs/encoding: Ensure RFC dates between years 0001 and 0099 are parsed
  correctly. ([#1516])
- @cosmjs/tendermint-rpc: Remove hacky `decodeOptionalTime()` from adaptors now
  that `time.Time` dates are parsed correctly. ([#1516])

[#1516]: https://github.com/cosmos/cosmjs/pull/1516

## [0.32.0] - 2023-11-23

### Added

- @cosmjs/stargate and @cosmjs/cosmwasm-stargate:
  `sign`/`signAndBroadcast`/`signAndBroadcastSync` and related functions now
  have an additional parameter to specify the timeout height. After this height,
  a signed transaction will be considered invalid by the chain. ([#1489])
- @cosmjs/amino: Export `omitDefault` to help build Amino JSON converters.

[#1489]: https://github.com/cosmos/cosmjs/pull/1489

### Fixed

- @cosmjs/stargate: Handle key value pairs in tx search correctly if the value
  is a numeric value. ([#1462])
- @cosmjs/cosmwasm-stargate: Make `fix_msg` optional in
  `AminoMsgInstantiateContract2` and omit default in the Amino JSON converter to
  fix Amino JSON signing for MsgInstantiateContract2. ([#1509])

[#1462]: https://github.com/cosmos/cosmjs/issues/1462
[#1509]: https://github.com/cosmos/cosmjs/pull/1509

### Changed

- all: Upgrade cosmjs-types to 0.9.0. This makes a few fields non-optional. It
  changes all 64 bit int fields from type `long` to `bigint`. As part of the
  upgrade, the types do not require the `long` and `protobufjs` anymore.
  ([#1484])
- all: `gasWanted`/`gasUsed` fields were changed from type `number` to `bigint`
  to supported cases where users put very high gas values in there ([#1465]).
- Drop support for Node.js 14 and add support for Node.js 20. ([#1421])
- @cosmjs/tendermint-rpc: Remove `Adaptor` abstractions which are not needed
  anymore by haing a dedicated client for each backend.
- @cosmjs/tendermint-rpc: Add
  `CometClient = Tendermint34Client | Tendermint37Client | Comet38Client` and
  `connectComet` for auto-detecting the right client for a provided endpoint.
- @cosmjs/stargate: Let `SigningStargateClient.createWithSigner` and
  `StargateClient.create` take a `CometClient` argument, adding support for
  `Comet38Client`. The auto-detection in
  `SigningStargateClient.connectWithSigner` and `StargateClient.connect` now
  supports CometBFT 0.38. Rename
  `StargateClient.getTmClient`/`.forceGetTmClient` to
  `.getCometClient`/`.forceGetCometClient`.
- @cosmjs/cosmwasm-stargate: Let `SigningCosmWasmClient.createWithSigner` and
  `CosmWasmClient.create` take a `CometClient` argument, adding support for
  `Comet38Client`. The auto-detection in
  `SigningCosmWasmClient.connectWithSigner` and `CosmWasmClient.connect` now
  supports CometBFT 0.38. Rename
  `CosmWasmClient.getTmClient`/`.forceGetTmClient` to
  `.getCometClient`/`.forceGetCometClient`.
- @cosmjs/stargate: Remove interfaces `SearchBySentFromOrToQuery` and
  `SearchByHeightQuery` which became obsolete with the `searchTx` change in
  0.31.0.

[#1421]: https://github.com/cosmos/cosmjs/issues/1421
[#1465]: https://github.com/cosmos/cosmjs/issues/1465
[#1484]: https://github.com/cosmos/cosmjs/pull/1484

### Deprecated

- @cosmjs/tendermint-rpc: `CometClient` should be used instead of
  `TendermintClient`.
- @cosmjs/stargate: Deprecate `SigningStargateClient.sendIbcTokens`. Please use
  `signAndBroadcast` + `MsgTransferEncodeObject` instead. ([#1493])
- @cosmjs/stargate: Deprecate `IndexedTx.rawLog` and `DeliverTxResponse.rawLog`
  because those fields are unset from Cosmos SDK 0.50 onwards (see
  [here](https://github.com/cosmos/cosmos-sdk/pull/15845)).

[#1493]: https://github.com/cosmos/cosmjs/issues/1493

## [0.31.3] - 2023-10-25

### Fixed

- @cosmjs/stargate: Add missing memo field to `fromAmino` implementation for
  `MsgTransfer`. ([#1493])

[#1493]: https://github.com/cosmos/cosmjs/issues/1493

## [0.31.2] - 2023-10-24

### Fixed

- @cosmjs/stargate: Add missing memo field to Amino JSON representation of
  `MsgTransfer` and adapt converters. ([#1456])

[#1456]: https://github.com/cosmos/cosmjs/pull/1456

## [0.31.1] - 2023-08-21

### Fixed

- @cosmjs/tendermint-rpc: Add missing `earliest_*` fields to `SyncInfo` record
  returned from the `/status` RPC endpoint ([#1448]).

### Changed

- @cosmjs/stargate, @cosmjs/cosmwasm-stargate: Change default multiplier for gas
  simulation from 1.3 to 1.4 to avoid out of case cases starting with Cosmos SDK
  0.47.
- @cosmjs/cosmwasm-stargate: Reduce default gas multiplier for
  `SigningCosmWasmClient.upload` to 1.1. ([#1360])

[#1360]: https://github.com/cosmos/cosmjs/issues/1360

## [0.31.0] - 2023-06-22

### Fixed

- @cosmjs/crypto: Migrate to `libsodium-wrappers-sumo` to be able to use the
  `crypto_pwhash` functions ([#1429]).

[#1429]: https://github.com/cosmos/cosmjs/issues/1429

### Added

- @cosmjs/cosmwasm-stargate: Add `SigningCosmWasmClient.instantiate2` ([#1407]).
- @cosmjs/cosmwasm-stargate: Add `CosmWasmClient.getContractsByCreator`
  ([#1266]).
- @cosmjs/stargate: `IndexedTx` and `DeliverTxResponse` now have a
  `msgResponses` field ([#1305]).
- @cosmjs/cosmwasm-stargate: Add `CosmWasmClient.broadcastTxSync` and
  `SigningCosmWasmClient.signAndBroadcastSync` to allow broadcasting without
  waiting for block inclusion. ([#1396])
- @cosmjs/stargate: Add `StargateClient.broadcastTxSync` and
  `SigningStargateClient.signAndBroadcastSync` to allow broadcasting without
  waiting for block inclusion. ([#1396])
- @cosmjs/cosmwasm-stargate: Add Amino JSON support for
  `MsgStoreCode.instantiate_permission`. ([#334])
- @cosmjs/stargate: Add group and gov v1 message types

[#334]: https://github.com/cosmos/cosmjs/issues/334
[#1266]: https://github.com/cosmos/cosmjs/issues/1266
[#1305]: https://github.com/cosmos/cosmjs/issues/1305
[#1396]: https://github.com/cosmos/cosmjs/pull/1396
[#1407]: https://github.com/cosmos/cosmjs/pull/1407

### Changed

- all: upgrade cosmjs-types to 0.8.0 to include Cosmos SDK 0.46/0.47 and IBC v7
  types.
- @cosmjs/cosmwasm-stargate: Implement auto-detection for Tendermint 0.34/37
  ([#1411]).
- @cosmjs/cosmwasm-stargate: Remove structured `searchTx` queries. Only raw
  query strings and key/value pairs are now supported. ([#1411])
- @cosmjs/cosmwasm-stargate: Let `searchTx` return non-readonly array. The
  caller owns this array and can mutate it as they want. ([#1411])
- @cosmjs/cosmwasm-stargate: In `UploadResult` (result from
  `SigningCosmWasmClient.upload`), rename `originalChecksum` to `checksum` and
  remove `compressedChecksum` ([#1409]).
- @cosmjs/stargate: Implement auto-detection for Tendermint 0.34/37 ([#1411]).
- @cosmjs/stargate: Remove structured `searchTx` queries. Only raw query strings
  and key/value pairs are now supported. ([#1411])
- @cosmjs/stargate: Let `searchTx` return non-readonly array. The caller owns
  this array and can mutate it as they want. ([#1411])
- @cosmjs/stargate: Remove `QueryClient.queryUnverified` and
  `QueryClient.queryVerified`. Please use `QueryClient.queryAbci` and
  `QueryClient.queryStoreVerified` instead.
- @cosmjs/stargate: Remove "not_supported_by_chain" option for Amino converter
  types since this is not needed anymore. ([#1403])

[#1403]: https://github.com/cosmos/cosmjs/issues/1403
[#1409]: https://github.com/cosmos/cosmjs/issues/1409
[#1411]: https://github.com/cosmos/cosmjs/pull/1411

## [0.30.1] - 2023-03-22

### Fixed

- @cosmjs/amino: Fix escaping of "&", "<" and ">" characters in Amino JSON
  encoding to match the Go implementation ([#1373], [#1388]).
- @cosmjs/tendermint-rpc: Move version check from
  `Tendermint{34,37}Client.create` to `.connect` in order to allow creating
  clients without performing the extra network request ([#1358]).
- @cosmjs/cli, @cosmjs/faucet: Add missing `bin/` directory to the
  package.json's `files` list to ship it as part of the released package.

[#1358]: https://github.com/cosmos/cosmjs/issues/1358
[#1373]: https://github.com/cosmos/cosmjs/pull/1373
[#1388]: https://github.com/cosmos/cosmjs/pull/1388

## [0.30.0] - 2023-03-09

### Changed

- all: The TypeScript compilation target is now ES2020 ([#1002]).
- all: Add full support for Node.js 18 and run all CI tests with it ([#1240]).
- all: Upgrade cosmjs-types to 0.7.
- @cosmjs/tendermint-rpc: Remove unused `index` field from `RpcTxEvent` and
  `TxEvent`. This is unset starting with Tendermint 0.34.
- @cosmjs/proto-signing: Make input and output of `decodePubkey` non-optional
  ([#1289]).
- @cosmjs/stargate: Remove unnecessary address prefix argument from
  `createStakingAminoConverters`. This made `prefix` in
  `SigningCosmWasmClientOptions` and `SigningStargateClientOptions` obsolete, so
  this was also deleted. ([#1291])
- @cosmjs/proto-signing: Remove `fromJSON`/`toJSON` from `TsProtoGeneratedType`
  such that generated types are not required to generate those anymore. The
  methods were provided by ts-proto but we never needed them. ([#1329])
- @cosmjs/stargate: Rename `fromTendermint34Event` to `fromTendermintEvent` and
  let it support both Tendermint 0.34 and 0.37 events as input.
- @cosmjs/cosmwasm-stargate: Remove `cosmWasmTypes`. Use
  `createWasmAminoConverters()` instead.
- @cosmjs/encoding: Remove previously deprecated `Bech32` class. Please replace
  `Bech32.encode`/`.decode` with free the functions `toBech32`/`fromBech32`.
- @cosmjs/cosmwasm-stargate: Changed the `SigningCosmWasmClient` constructor to
  include all Amino type converters that the `SigningStargateClient` uses by
  default, to match the default registry types ([#1384]).

[#1002]: https://github.com/cosmos/cosmjs/issues/1002
[#1240]: https://github.com/cosmos/cosmjs/pull/1240
[#1289]: https://github.com/cosmos/cosmjs/issues/1289
[#1291]: https://github.com/cosmos/cosmjs/issues/1291
[#1329]: https://github.com/cosmos/cosmjs/pull/1329
[#1384]: https://github.com/cosmos/cosmjs/pull/1384

### Added

- @cosmjs/stargate: Add `granteeGrants` and `granterGrants` queries to
  `AuthzExtension` ([#1308]).
- @cosmjs/tendermint-rpc: Add new `Tendermint37Client` and remove unused
  `Tendermint35Client`; Add `TendermintClient` as a union type for
  `Tendermint34Client` or `Tendermint37Client` and
  `isTendermint34Client`/`isTendermint37Client` to get the specific type
  ([#1376]).
- @cosmjs/stargate: Add constructors `StargateClient.create` and
  `SigningStargateClient.createWithSigner` to construct with a given Tendermint
  client ([#1376]).
- @cosmjs/cosmwasm-stargate: Add constructors `CosmWasmClient.create` and
  `SigningCosmWasmClient.createWithSigner` to construct with a given Tendermint
  client ([#1376]).
- @cosmjs/cosmwasm-stargate: Add `instantiate2Address` to pre-calculate
  addresses for Instantiate2 ([#1253]).
- @cosmjs/stargate: Add `txIndex` to `DeliverTxResponse` and `IndexedTx`
  ([#1361]).
- @cosmjs/stargate: Add `createDefaultAminoConverters` to access the
  `SigningStargateClient`'s list of default Amino type converters to match the
  default registry types in `defaultStargateTypes` ([#1384]).

[#1253]: https://github.com/cosmos/cosmjs/pull/1253
[#1308]: https://github.com/cosmos/cosmjs/pull/1308
[#1361]: https://github.com/cosmos/cosmjs/issues/1361
[#1376]: https://github.com/cosmos/cosmjs/pull/1376
[#1384]: https://github.com/cosmos/cosmjs/pull/1384

## [0.29.5] - 2022-12-07

### Fixed

- @cosmjs/stargate: Fix `protoDecimalToJson` for values with a 0 fractional
  part, such as `0.000000000000000000`, `1.000000000000000000` or
  `42.000000000000000000` ([#1326]).

[#1326]: https://github.com/cosmos/cosmjs/pull/1326

### Changed

- @cosmjs/crypto: `getSubtle()` does not use `getCryptoModule()` anymore to find
  a subtle implementation. Turns out all environments we support have subtle in
  `globalThis` or do not have it at all ([#1307], [#1340]).

[#1307]: https://github.com/cosmos/cosmjs/pull/1307
[#1340]: https://github.com/cosmos/cosmjs/pull/1340

### Deprecated

- @cosmjs/stargate: Deprecate `QueryClient.queryUnverified` in favour of newly
  added `QueryClient.queryAbci`.
- @cosmjs/stargate: Deprecate `QueryClient.queryVerified` in favour of newly
  added `QueryClient.queryStoreVerified`.

## [0.29.4] - 2022-11-15

### Added

- @cosmjs/tendermint-rpc: The options in the `HttpBatchClient` constructor are
  now of type `Partial<HttpBatchClientOptions>`, allowing you to set only the
  fields you want to change ([#1309]).
- @cosmjs/tendermint-rpc: Add missing exports `HttpBatchClient`,
  `HttpBatchClientOptions`, `RpcClient` ([#1311]).
- @cosmjs/tendermint-rpc: Send batch immediately when full in `HttpBatchClient`
  ([#1310]).

[#1309]: https://github.com/cosmos/cosmjs/issues/1309
[#1310]: https://github.com/cosmos/cosmjs/issues/1310
[#1311]: https://github.com/cosmos/cosmjs/issues/1311

### Fixed

- @cosmjs/cosmwasm-stargate: Fix `ContractCodeHistory` decoding when msg
  contains non-printable ASCII ([#1320]).
- @cosmjs/crypto: Bump elliptic version to ^6.5.4 due to
  [CVE-2020-28498](https://github.com/advisories/GHSA-r9p9-mrjm-926w).

[#1320]: https://github.com/cosmos/cosmjs/pull/1320

## [0.29.3] - 2022-10-25

### Added

- @cosmjs/tendermint-rpc: Add `HttpBatchClient`, which implements `RpcClient`,
  supporting batch RPC requests ([#1300]).
- @cosmjs/encoding: Add `lossy` parameter to `fromUtf8` allowing the use of a
  replacement charater instead of throwing.
- @cosmjs/stargate: Add structured `Events`s to `IndexTx.events` and
  `DeliverTxResponse.events`.
- @cosmjs/cosmwasm-stargate: Add structured `Events`s field to
  `SigningCosmWasmClient`s transaction execution methods.

### Fixed

- @cosmjs/stargate: Fix Amino JSON encoding of the unset case of
  `commission_rate` and `min_self_delegation` in
  `MsgEditValidator`/`AminoMsgEditValidator`.

## [0.29.2] - 2022-10-13

### Added

- @cosmjs/amino: Add `encodeEd25519Pubkey` analogue to the existing
  `encodeSecp256k1Pubkey`.
- @cosmjs/proto-signing: Add Ed25519 support to `encodePubkey` and
  `anyToSinglePubkey`. Export `anyToSinglePubkey`.
- @cosmjs/utils: Add `isDefined` which checks for `undefined` in a
  TypeScript-friendly way.
- @cosmjs/stargate: Add missing `{is,}MsgBeginRedelegateEncodeObject`,
  `{is,MsgCreateValidatorEncodeObject}` and `{is,MsgEditValidatorEncodeObject}`.

[#1300]: https://github.com/cosmos/cosmjs/pull/1300

### Fixed

- @cosmjs/cosmwasm-stargate: Use type `JsonObject = any` for smart query
  requests and messages (in `WasmExtension.wasm.queryContractSmart`,
  `CosmWasmClient.queryContractSmart`, `SigningCosmWasmClient.instantiate`,
  `SigningCosmWasmClient.migrate`, `SigningCosmWasmClient.execute`). This
  reverts the type change done in CosmJS 0.23.0. ([#1281], [#1284])
- @cosmjs/cosmwasm-stargate: `AminoMsgCreateValidator` and
  `createStakingAminoConverters` were fixed after testing both
  `MsgCreateValidator` and `MsgEditValidator` in sign mode direct and Amino JSON
  ([#1290]).

[#1281]: https://github.com/cosmos/cosmjs/pull/1281
[#1284]: https://github.com/cosmos/cosmjs/pull/1284
[#1290]: https://github.com/cosmos/cosmjs/pull/1290

## [0.29.1] - 2022-10-09

### Changed

- @cosmjs/stargate, @cosmjs/cosmwasm-stargate: Add address to "Account does not
  exist on chain." error message.

## [0.29.0] - 2022-09-15

### Added

- @cosmjs/stargate: Add `makeMultisignedTxBytes` which is like
  `makeMultisignedTx` but returns bytes ready to broadcast ([#1176]).
- @cosmjs/tendermint-rpc: Add Tendermint 0.35 client (private, unusable). This
  is currently not used by higher level clients as Cosmos SDK 0.42-0.46 use
  Tendermint 0.34. It may become public or evolve into a Tendermint 0.36+ client
  from here. If you need this client, please comment in [#1225] or open a new
  issue. ([#1154] and [#1225])
- @cosmjs/tendermint-rpc: Add fields `codespace` and `info` to
  `AbciQueryResponse`.
- @cosmjs/cosmwasm-stargate: Add `SigningCosmWasmClient.executeMultiple`
  ([#1072]).
- @cosmjs/math: Add `{Uint32,Int53,Uint53,Uint64}.toBigInt` converter methods.
- @cosmjs/stargate: Add missing exports `AminoMsgTransfer`/`isAminoMsgTransfer`.
- @cosmjs/stargate: Add support for `MsgVoteWeighted` (register by default and
  create Amino JSON converters) ([#1224]).
- @cosmjs/stargate: Add Amino JSON support for `MsgCreateVestingAccount`.
- @cosmjs/stargate and @cosmjs/cosmwasm-stargate: Create and use
  BroadcastTxError ([#1096]).
- @cosmjs/stargate: Add height parameter to `QueryClient.queryUnverified`
  ([#1250]).
- @cosmjs/faucet: Allow configuring the cooldown value via
  `FAUCET_COOLDOWN_TIME` environment variable.
- @cosmjs/stargate: Add missing exports `setupAuthzExtension`,
  `setupFeegrantExtension` and `setupSlashingExtension` ([#1261]).
- @cosmjs/stargate: Add missing exports `createCrysisAminoConverters`,
  `createEvidenceAminoConverters`, `createSlashingAminoConverters` and
  `createVestingAminoConverters` ([#1261]).

[#1072]: https://github.com/cosmos/cosmjs/issues/1072
[#1096]: https://github.com/cosmos/cosmjs/issues/1096
[#1154]: https://github.com/cosmos/cosmjs/issues/1154
[#1176]: https://github.com/cosmos/cosmjs/pull/1176
[#1224]: https://github.com/cosmos/cosmjs/pull/1224
[#1225]: https://github.com/cosmos/cosmjs/issues/1225
[#1250]: https://github.com/cosmos/cosmjs/issues/1250
[#1261]: https://github.com/cosmos/cosmjs/pull/1261

### Fixed

- @cosmjs/stargate: Fix valid values of `BondStatusString` for `validators`
  query ([#1170]).
- @cosmjs/tendermint-rpc: Fix decoding validator updates due to slashing
  ([#1177]).
- @cosmjs/math: Check for negative values in `Decimal.fromAtomics` ([#1188]).
- @cosmjs/tendermint-rpc: Fix `key` and `value` type in `RpcAbciQueryResponse`
  to also include the `null` option.
- @cosmjs/tendermint-rpc: Fix decoding events without attributes ([#1198]).
- @cosmjs/amino, @cosmjs/proto-signing: Support amounts larger than the uint64
  range in `parseCoins` ([#1268]).
- @cosmjs/cosmwasm-stargate: Accept non-ASCII inputs in query requests of
  `{CosmWasmClient,WasmExtension}.queryContractSmart` ([#1269]).

[#1170]: https://github.com/cosmos/cosmjs/issues/1170
[#1177]: https://github.com/cosmos/cosmjs/issues/1177
[#1188]: https://github.com/cosmos/cosmjs/pull/1188
[#1198]: https://github.com/cosmos/cosmjs/pull/1198
[#1268]: https://github.com/cosmos/cosmjs/issues/1268
[#1269]: https://github.com/cosmos/cosmjs/issues/1269

### Changed

- all: Upgrade cosmjs-types to 0.5 ([#1131]).
- all: Drop support for Node.js < 14.
- all: Use caret version for internal dependencies' version ranges ([#1254]).
- @cosmjs/stargate: Change `packetCommitment` parameter `sequence` type from
  `Long` to `number` ([#1168]).
- @cosmjs/tendermint-rpc: The type of `votingPower` fields was changed from
  `number` to `bigint` as those values can exceed the safe integer range
  ([#1133]).
- @cosmjs/stargate: Remove Cosmos SDK 0.42 support ([#1094]).
- @cosmjs/tendermint-rpc: Change spelling of field `codeSpace` to `codespace` in
  `TxData` and `BroadcastTxSyncResponse` ([#1234]).
- @cosmjs/stargate: `BankExtension.totalSupply` now takes a pagination key
  argument and returns the full `QueryTotalSupplyResponse` including the next
  pagination key ([#1095]).
- @cosmjs/proto-signing: `makeAuthInfoBytes` now expects a fee granter and fee
  payer argument in position 4 and 5.
- @cosmjs/stargate: Rename exported function `createFreegrantAminoConverters` to
  `createFeegrantAminoConverters` due to a typo ([#1261).

[#1131]: https://github.com/cosmos/cosmjs/pull/1131
[#1168]: https://github.com/cosmos/cosmjs/pull/1168
[#1133]: https://github.com/cosmos/cosmjs/issues/1133
[#1094]: https://github.com/cosmos/cosmjs/issues/1094
[#1234]: https://github.com/cosmos/cosmjs/issues/1234
[#1095]: https://github.com/cosmos/cosmjs/issues/1095
[#1254]: https://github.com/cosmos/cosmjs/issues/1254
[#1261]: https://github.com/cosmos/cosmjs/pull/1261

## [0.28.11] - 2022-07-13

### Fixed

- @cosmjs/faucet: Fix cooldown value from 86 seconds to 24 hours.

## [0.28.10] - 2022-06-29

### Fixed

- @cosmjs/tendermint-rpc: Fix decoding events without attributes ([#1198]).

[#1198]: https://github.com/cosmos/cosmjs/pull/1198

## [0.28.9] - 2022-06-21

This version replaces the 0.28.8 release which was erroneously tagged as 0.26.8
and released to npm under that wrong version. In order to avoid further
confusion we give up the .8 patch version. Users should install `^0.28.9` for
all `@cosmjs/*` packages to be safe. Users of `^0.26` should upgrade to a more
recent minor version if they run into trouble.

## [0.28.8] - 2022-06-21

- @cosmjs/tendermint-rpc: Fix decoding validator updates due to slashing
  ([#1177]).

[#1177]: https://github.com/cosmos/cosmjs/issues/1177

## [0.28.7] - 2022-06-14

### Fixed

- @cosmjs/stargate: Fix valid values of `BondStatusString` for `validators`
  query ([#1170]).

[#1170]: https://github.com/cosmos/cosmjs/issues/1170

### Changed

- @cosmjs/proto-signing, @cosmjs/cosmwasm-stargate: Turn `protobufjs` into a
  devDependency ([#1166]).

[#1166]: https://github.com/cosmos/cosmjs/pull/1166

## [0.28.6] - 2022-06-08

## [0.28.5] - 2022-06-08

### Added

- @cosmjs/math: Add `Decimal.floor` and `Decimal.ceil`.
- @cosmjs/tendermint-rpc: Add `num_unconfirmed_txs` endpoint. ([#1150])

[#1150]: https://github.com/cosmos/cosmjs/pull/1150

### Changed

- @cosmjs/stargate: Let `calculateFee` handle fee amounts that exceed the safe
  integer range.
- @cosmjs/cosmwasm-stargate, @cosmjs/stargate, @cosmjs/proto-signing: Upgrade
  protobufjs to 6.11.

### Fixed

- @cosmjs/tendermint-rpc: Fix block results validator update decoder. ([#1151])

[#1151]: https://github.com/cosmos/cosmjs/issues/1151

## [0.28.4] - 2022-04-15

### Added

- @cosmjs/math: Add `Decimal.zero` and `Decimal.one` ([#1110]).
- @cosmjs/amino: Add `addCoins` ([#1116])
- @cosmjs/stargate: Add `StargateClient.getBalanceStaked()` to query the sum of
  all staked balance. ([#1116])

### Changed

- @cosmjs/faucet: Docker build image is 90 % smaller now (from 500 MB to 50 MB)
  due to build system optimizations ([#1120], [#1121]).
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.connect` and
  `SigningCosmWasmClient.connectWithSigner` now accept custom HTTP headers
  ([#1007])
- @cosmjs/stargate: `StargateClient.connect` and
  `SigningStargateClient.connectWithSigner` now accept custom HTTP headers
  ([#1007])
- @cosmjs/tendermint-rpc: `Tendermint34Client.connect` now accepts custom HTTP
  headers ([#1007]).

[#1007]: https://github.com/cosmos/cosmjs/issues/1007
[#1110]: https://github.com/cosmos/cosmjs/issues/1110
[#1120]: https://github.com/cosmos/cosmjs/pull/1120
[#1121]: https://github.com/cosmos/cosmjs/pull/1121
[#1116]: https://github.com/cosmos/cosmjs/issues/1116

## [0.28.3] - 2022-04-11

### Added

- @cosmjs/encoding: Add missing export: `normalizeBech32`.

## [0.28.2] - 2022-04-07

### Added

- @cosmjs/encoding: Create `normalizeBech32`.
- @cosmjs/stargate: Added support for `MsgCreateVestingAccount` ([#1074]).
  Please note that Amino JSON signing is currently not available for this type
  ([#1115]).

[#1074]: https://github.com/cosmos/cosmjs/issues/1074
[#1115]: https://github.com/cosmos/cosmjs/issues/1115

## [0.28.1] - 2022-03-30

### Added

- @cosmjs/stargate: Added the ability to specify a custom account parser for
  `StargateClient`

### Fixed

- @cosmjs/proto-signing: Add missing runtime dependencies @cosmjs/encoding and
  @cosmjs/utils.
- @cosmjs/tendermint-rpc: Add missing runtime dependency @cosmjs/utils.

## [0.28.0] - 2022-03-17

### Changed

- all: The TypeScript compilation target is now ES2018.
- @cosmjs/crypto: Add `Secp256k1.uncompressPubkey`.
- @cosmjs/crypto: Replace hashing implementations with @noble/hashes ([#960]).
- @cosmjs/faucet: Set default value of `FAUCET_GAS_LIMIT` to 100_000 to better
  support Cosmos SDK 0.45 chains.
- @cosmjs/stargate: The `AminoTypes` now always requires an argument of type
  `AminoTypesOptions`. This is an object with a required `prefix` field. Before
  the prefix defaulted to "cosmos" but this is almost never the right choice for
  CosmJS users that need to add Amino types manually. ([#989])
- @cosmjs/cosmwasm-stargate: `height`, `gasWanted` and `gasUsed` have been added
  to all result types of `SigningCosmWasmClient`
- @cosmjs/stargate: `MsgSend` and `Coin` are now parts of
  `defaultRegistryTypes`. ([#994])
- @cosmjs/proto-signing: `Registry`'s constructor can now override default
  types. ([#994])
- @cosmjs/tendermint-rpc: The property `evidence` in the interface `Block` is
  now non-optional. ([#1011])
- @cosmjs/stargate: Added the following message types to stargate's
  `defaultRegistryTypes`: ([#1026])
  - cosmos.authz.v1beta1.MsgGrant
  - cosmos.authz.v1beta1.MsgExec
  - cosmos.authz.v1beta1.MsgRevoke
  - cosmos.feegrant.v1beta1.MsgGrantAllowance
  - cosmos.feegrant.v1beta1.MsgRevokeAllowance
- @cosmjs/stargate: In `AminoTypes` the uniqueness of the Amino type identifier
  is checked in `fromAmino` now instead of the constructor. This only affects
  you if multiple different protobuf type URLs map to the same Amino type
  identifier which should not be the case anyways.
- @cosmjs/stargate: Added support for slashing queries ([#927])
- @cosmjs/ledger-amino: Renamed `LaunchpadLedger` to `LedgerConnector` ([#955])
- @cosmjs/encoding: Created `toBech32()` and `fromBech32()`. Class Bech32 is now
  deprecated and should not longer be used. ([#1053])
- @cosmjs/crypto: Use a custom BIP-39 implementation to reduce external
  dependencies. This should also reduce the bundle size as only the English
  wordlist is shipped. ([#966])
- @cosmjs/cli: Rename binary `cosmwasm-cli` to `cosmjs-cli` ([#1033]).
- @cosmjs/stargate: Added Authz queries. ([#1080]).
- @cosmjs/stargate & @cosmjs/cosmwasm-stargate: Removed default types from
  AminoTypes. ([#1079])
- @cosmjs/cosmwasm-stargate: getCodes() automatically loops through all
  pagination pages now. ([#1077])
- @cosmjs/stargate & @cosmjs/cosmwasm-stargate: Timeout Errors shows more
  relevant information about the timeout. ([#1066])

[#927]: https://github.com/cosmos/cosmjs/issues/927
[#955]: https://github.com/cosmos/cosmjs/issues/955
[#960]: https://github.com/cosmos/cosmjs/pull/960
[#966]: https://github.com/cosmos/cosmjs/pull/966
[#989]: https://github.com/cosmos/cosmjs/issues/989
[#994]: https://github.com/cosmos/cosmjs/issues/994
[#1011]: https://github.com/cosmos/cosmjs/issues/1011
[#1026]: https://github.com/cosmos/cosmjs/issues/1026
[#1033]: https://github.com/cosmos/cosmjs/issues/1033
[#1053]: https://github.com/cosmos/cosmjs/issues/1053
[#1066]: https://github.com/cosmos/cosmjs/issues/1066
[#1077]: https://github.com/cosmos/cosmjs/issues/1077
[#1078]: https://github.com/cosmos/cosmjs/issues/1078
[#1079]: https://github.com/cosmos/cosmjs/issues/1079
[#1080]: https://github.com/cosmos/cosmjs/issues/1080

### Removed

- @cosmjs/crypto: Remove the SHA1 implementation (`Sha1` and `sha1`) as it is
  not used in the Cosmos tech stack and not implemented in the hashing lib we
  want to migrate to ([#1003]). Also it has known weaknesses.
- @cosmjs/launchpad: Package was removed as no support for Cosmos SDK 0.37-0.39
  is needed anymore ([#947]).

[#947]: https://github.com/cosmos/cosmjs/issues/947
[#1003]: https://github.com/cosmos/cosmjs/issues/1003

## [0.27.1] - 2022-01-26

### Added

- @cosmjs/cosmwasm-stargate: Add `fromBinary`/`toBinary` to convert between
  JavaScript objects and the JSON representation of `cosmwasm_std::Binary`
  (base64).
- @cosmjs/cosmwasm-stargate: Export `WasmExtension` and `setupWasmExtension`.
- @cosmjs/ledger-amino: Added `LedgerSigner.showAddress` and
  `LaunchpadLedger.showAddress` to show the user's address in the Ledger screen.

### Changed

- @cosmjs/stargate: The error messages for missing types in `AminoTypes` now
  contain the type that was searched for ([#990]).
- @cosmjs/tendermint-rpc: Change the `Evidence` type to `any` and avoid decoding
  it. The structure we had before was outdated and trying to decode it led to
  exceptions at runtime when a block with actual values was encountered.
  ([#980])

[#990]: https://github.com/cosmos/cosmjs/pull/990
[#980]: https://github.com/cosmos/cosmjs/issues/980

## [0.27.0] - 2022-01-10

### Added

- @cosmjs/tendermint-rpc: Add `hash` field to `BroadcastTxAsyncResponse`
  ([#938]).
- @cosmjs/stargate: Add `denomMetadata` and `denomsMetadata` to `BankExtension`
  ([#932]).
- @cosmjs/stargate: Merge `DeliverTxFailure` and `DeliverTxSuccess` into a
  single `DeliverTxResponse` ([#878], [#949]). Add `assertIsDeliverTxFailure`.
- @cosmjs/stargate: Created initial `MintExtension`.
- @cosmjs/stargate: Created `types.Dec` decoder function
  `decodeCosmosSdkDecFromProto`.
- @cosmjs/amino: Added `StdTx`, `isStdTx` and `makeStdTx` and removed them from
  @cosmjs/launchpad. They are re-exported in @cosmjs/launchpad for backwards
  compatibility.
- @cosmjs/stargate: Add `GasPrice.toString`.
- @cosmjs/faucet: Added a new functionality to faucet: Each address is only
  allowed to get credits once every 24h to prevent draining. ([#962]))

[#962]: https://github.com/cosmos/cosmjs/issues/962
[#938]: https://github.com/cosmos/cosmjs/issues/938
[#932]: https://github.com/cosmos/cosmjs/issues/932
[#878]: https://github.com/cosmos/cosmjs/issues/878
[#949]: https://github.com/cosmos/cosmjs/issues/949

### Fixed

- @cosmjs/tendermint-rpc: Add missing `BlockSearchResponse` case to `Response`.

### Changed

- @cosmjs/stargate: Remove verified queries from `AuthExtension` and
  `BankExtension` as well as `StargateClient.getAccountVerified` because the
  storage layout is not stable across multiple Cosmos SDK releases. Verified
  queries remain available in the `IbcExtension` because for IBC the storage
  layout is standardized. Such queries can still be implemented in CosmJS caller
  code that only needs to support one backend. ([#865])
- @cosmjs/tendermint-rpc: Remove default URL from `HttpClient` and
  `WebsocketClient` constructors ([#897]).
- all: Upgrade cosmjs-types to 0.4. This includes the types of the Cosmos SDK
  0.44 modules x/authz and x/feegrant. It causes a few breaking changes by
  adding fields to interfaces as well as changing `Date` to a `Timestamp`
  object. ([#928])
- @cosmjs/stargate and @cosmjs/cosmwasm-stargate: Add simulation support
  ([#931]).
- @cosmjs/cosmwasm-stargate: Rename `BroadcastTx{Success,Failure}` to
  `DeliverTx{Success,Failure}`, `BroadcastTxResponse` to `DeliverTxResponse`,
  `isBroadcastTx{Success,Failure}` to `isDeliverTx{Success,Failure}` and
  `assertIsBroadcastTxSuccess` to `assertIsDeliverTxSuccess`. ([#946])
- @cosmjs/tendermint-rpc: Remove `Tendermint33Client` and related symbols.
- @cosmjs/cosmwasm-stargate: Add support for wasmd 0.21. This changes the AMINO
  JSON representation of `Msg{Execute,Instantiate,Migrate}Contract.msg` from
  base64 strings to JSON objects. ([#948])
- @cosmjs/cli: Replace `colors` dependency with `chalk` (see
  https://snyk.io/blog/open-source-npm-packages-colors-faker/)

[#865]: https://github.com/cosmos/cosmjs/issues/865
[#897]: https://github.com/cosmos/cosmjs/issues/897
[#928]: https://github.com/cosmos/cosmjs/issues/928
[#931]: https://github.com/cosmos/cosmjs/pull/931
[#709]: https://github.com/cosmos/cosmjs/issues/709
[#946]: https://github.com/cosmos/cosmjs/pull/946
[#948]: https://github.com/cosmos/cosmjs/pull/948

## [0.26.6] - 2022-01-10

### Changed

- @cosmjs/cli: Replace `colors` dependency with `chalk` (see
  https://snyk.io/blog/open-source-npm-packages-colors-faker/)

## [0.26.5] - 2021-11-20

### Added

- @cosmjs/amino: The `coin` and `coins` helpers now support both `number` and
  `string` as input types for the amount. This is useful if your values exceed
  the safe integer range.

### Fixed

- @cosmjs/tendermint-rpc: Fix undefined `this` in `decodeBroadcastTxAsync` and
  `broadcastTxAsync` ([#937]).

[#937]: https://github.com/cosmos/cosmjs/pull/937

## [0.26.4] - 2021-10-28

### Fixed

- @cosmjs/cosmwasm-stargate: Fix response error handling for smart queries.

## [0.26.3] - 2021-10-25

### Added

- @cosmjs/ledger-amino: Add support for using forks of the Cosmos Ledger app by
  adding the fields `LaunchpadLedgerOptions.ledgerAppName` and
  `.minLedgerAppVersion`.

### Deprecated

- @cosmjs/stargate: The verified queries from `AuthExtension` and
  `BankExtension` as well as `StargateClient.getAccountVerified` are deprecated
  and will be removed in 0.27 ([#910]).

[#910]: https://github.com/cosmos/cosmjs/pull/910

## [0.26.2] - 2021-10-12

### Fixed

- @cosmjs/stargate: remove extra space in messageTimeout registry.
- @cosmjs/cosmwasm-stargate: Fix Amino JSON representation of
  `MsgInstantiateContract`, `MsgMigrateContract` and `MsgExecuteContract` to
  match the wasmd expectation. This was broken since the wasmd upgrade to
  Stargate such that no Ledger signing was possible for those message types in
  the meantime.

## [0.26.1] - 2021-09-30

### Added

- @cosmjs/amino: `decodeBech32Pubkey` and `decodeAminoPubkey` now support
  decoding multisig public keys ([#882]).

### Fixed

- @cosmjs/stargate: Add missing pagination key arguments to query types in
  `GovExtension`.

[#882]: https://github.com/cosmos/cosmjs/issues/882

## [0.26.0] - 2021-08-24

### Added

- @cosmjs/tendermint-rpc: `Tendermint34Client.blockSearch` and
  `Tendermint34Client.blockSearchAll` were added to allow searching blocks in
  Tendermint 0.34.9+ backends.
- @cosmjs/tendermint-rpc: `Tendermint33Client` has been added to provide support
  for Tendermint v0.33.
- @cosmjs/tendermint-rpc: Exports relating to `Tendermint33Client` are now
  available under `tendermint33`.
- @cosmjs/proto-signing and @cosmjs/stargate: Create a Stargate-ready
  `parseCoins` that replaces the `parseCoins` re-export from `@cosmjs/amino`.
- @cosmjs/cosmwasm-stargate: Export `isValidBuilder`, which is a clone of
  `isValidBuilder` from @cosmjs/cosmwasm-launchpad.
- @cosmjs/cosmwasm-stargate: Copy symbols `Code`, `CodeDetails`, `Contract`,
  `ContractCodeHistoryEntry` and `JsonObject` from @cosmjs/cosmwasm-launchpad
  and remove dependency on @cosmjs/cosmwasm-launchpad.
- @cosmjs/faucet: Add new configuration variable `FAUCET_PATH_PATTERN` to
  configure the HD path of the faucet accounts ([#832]).
- @cosmjs/cosmwasm-stargate: Add field `ibcPortId` to `Contract` ([#836]).
- @cosmjs/stargate: Add `GovExtension` for query client.
- @cosmjs/stargate: Add support for `MsgDeposit`, `MsgSubmitProposal` and
  `MsgVote`.

[#832]: https://github.com/cosmos/cosmjs/issues/832
[#836]: https://github.com/cosmos/cosmjs/issues/836

### Changed

- @cosmjs/cosmwasm-launchpad: The `transferAmount` property on
  `InstantiateOptions` (accepted as a parameter to
  `SigningCosmWasmClient.instantiate`) has been renamed to `funds`.
- @cosmjs/cosmwasm-stargate: The `transferAmount` property on
  `InstantiateOptions` (accepted as a parameter to
  `SigningCosmWasmClient.instantiate`) has been renamed to `funds`.
- @cosmjs/cosmwasm-stargate: Default fee/gas values have been removed. Fees now
  need to be calculated and passed to `SigningCosmWasmClient` when calling any
  methods which submit transactions to the blockchain.
- @cosmjs/stargate: Default fee/gas values have been removed. Fees now need to
  be calculated and passed to `SigningStargateClient` when calling any methods
  which submit transactions to the blockchain.
- @cosmjs/tendermint-rpc: Make `tendermint34.Header.lastBlockId` and
  `tendermint34.Block.lastCommit` optional to better handle the case of height 1
  where there is no previous block.
- @cosmjs/proto-signing: `makeAuthInfoBytes` now takes an array of pubkey
  sequence pairs in order to support different sequences for different signers.
- @cosmjs/cosmwasm-stargate: Upgraded client to support wasmd 0.18 backends.
  Other backends are not supported anymore. Update proto types from
  `cosmwasm.wasm.v1beta1.*` to `cosmwasm.wasm.v1.*`. `MsgStoreCode.source` and
  `MsgStoreCode.builder` were removed; `MsgInstantiateContract.initMsg` and
  `MsgMigrateContract.migrateMsg` were renamed to `msg`; `Code.{source,builder}`
  and `CodeDetails.{source,builder}` were removed; `isValidBuilder` was removed;
  `UploadMeta` and the `meta` from `SigningCosmWasmClient.upload` were removed.
  ([#863])

[#863]: https://github.com/cosmos/cosmjs/pull/863

### Removed

- Node.js v10 is no longer supported. Please use v12 or later.
- @cosmjs/cosmwasm-stargate: Remove `CosmWasmFeeTable` type and
  `defaultGasLimits` object.
- @cosmjs/stargate: Remove types, objects and functions to do with default fees:
  `CosmosFeeTable`, `FeeTable`, `GasLimits`, `defaultGasLimits`,
  `defaultGasPrice` and `buildFeeTable`.
- @cosmjs/tendermint-rpc: `Client` has been removed. Please use
  `Tendermint33Client` or `Tendermint34Client`, depending on your needs.
- @cosmjs/cosmwasm: Package removed ([#786]).
- @cosmjs/cosmwasm-launchpad: Package removed ([#786]).

[#786]: https://github.com/cosmos/cosmjs/issues/786

### Fixed

- @cosmjs/socket: Upgrade dependency "ws" to version 7 to avoid potential
  security problems.

## [0.25.6] - 2021-07-26

### Fixed

- @cosmjs/stargate: Fix types `AminoMsgTransfer` and `AminoHeight` as well as
  the encoding of `MsgTransfer` for Amino signing.

## [0.25.5] - 2021-06-23

### Added

- @cosmjs/tendermint-rpc: `Tendermint34Client.blockSearch` and
  `Tendermint34Client.blockSearchAll` were added to allow searching blocks in
  Tendermint 0.34.9+ backends. This is a backport of [#815]. Note: Decoding
  blocks of height 1 is unsupported. This is fixed in [#815] and will be
  released as part of CosmJS 0.26.

[#815]: https://github.com/cosmos/cosmjs/pull/815

## [0.25.4] - 2021-05-31

### Fixed

- @cosmjs/socket: Upgrade dependency "ws" to version 7 to avoid potential
  security problems.

## [0.25.3] - 2021-05-18

### Fixed

- @cosmjs/cosmwasm-stargate, @cosmjs/stargate: Fix error propagation in
  `CosmWasmClient.broadcastTx` and `StargateClient.broadcastTx` ([#800]). This
  bug was introduced with the switch from broadcast mode "commit" to "sync" in
  version 0.25.0.
- @cosmjs/launchpad, @cosmjs/stargate: Avoid the use of named capture groups in
  `GasPrice.fromString` to restore ES2017 compatibility and make the library
  work with Hermes ([#801]; thanks [@AlexBHarley]).
- @cosmjs/launchpad: Adapt `GasPrice.fromString` denom pattern to Cosmos SDK
  0.39 rules: reduce denom length to 16 and allow digits in denom.
- @cosmjs/stargate: Adapt `GasPrice.fromString` denom pattern to Cosmos SDK 0.42
  rules: allow lengths up to 128, allow upper case letters and digits.

[#800]: https://github.com/cosmos/cosmjs/issues/800
[#801]: https://github.com/cosmos/cosmjs/issues/801
[@alexbharley]: https://github.com/AlexBHarley

## [0.25.2] - 2021-05-11

### Added

- @cosmjs/cosmwasm-stargate: Add `broadcastTimeoutMs` and
  `broadcastPollIntervalMs` options added to `SigningCosmWasmClientOptions`.
- @cosmjs/proto-signing: Add `serialize` and `serializeWithEncryptionKey`
  methods to `DirectSecp256k1HdWallet`. Also add `deserialize` and
  `deserializeWithEncryptionKey` static methods.
- @cosmjs/proto-signing: Export `extractKdfConfiguration` and `executeKdf`
  helper functions and `KdfConfiguration` type.
- @cosmjs/proto-signing: Export `makeCosmoshubPath` helper.
- @cosmjs/stargate: Export `makeCosmoshubPath` helper.
- @cosmjs/stargate: Add `broadcastTimeoutMs` and `broadcastPollIntervalMs`
  options added to `SigningStargateClientOptions`.

## [0.25.1] - 2021-05-06

### Added

- @cosmjs/cosmwasm-stargate: Export types `Code`, `CodeDetails`, `Contract`,
  `ContractCodeHistoryEntry` and `JsonObject` which are response types of
  `CosmWasmClient` methods. Export types `ChangeAdminResult`, `ExecuteResult`,
  `InstantiateOptions`, `InstantiateResult`, `MigrateResult`, `UploadMeta` and
  `UploadResult` which are argument or response types of `SigningCosmWasmClient`
  methods.

### Fixed

- @cosmjs/cosmwasm-stargate: Use `CosmWasmFeeTable` instead of `CosmosFeeTable`
  in `SigningCosmWasmClientOptions`; export type `CosmWasmFeeTable`.
- @cosmjs/amino, @cosmjs/cli, @cosmjs/ledger-amino, @cosmjs/proto-signing: Fix
  runtime error caused by passing explicitly undefined options.

## [0.25.0] - 2021-05-05

### Added

- @cosmjs/cosmwasm-launchpad: Expose `SigningCosmWasmClient.fees`.
- @cosmjs/cosmwasm-stargate: Expose `SigningCosmWasmClient.fees` and
  `SigningCosmWasmClient.registry`.
- @cosmjs/launchpad: Expose `SigningCosmosClient.fees`.
- @cosmjs/stargate: Expose `SigningStargateClient.fees` and
  `SigningStargateClient.registry`.
- @cosmjs/stargate: Add support for different account types in `accountFromAny`
  and `StargateClient`. Added `ModuleAccount` and vesting accounts
  `BaseVestingAccount`, `ContinuousVestingAccount`, `DelayedVestingAccount` and
  `PeriodicVestingAccount`.
- @cosmjs/stargate: Add codecs for IBC channel tx, client query/tx, and
  connection tx, as well as Tendermint.
- @cosmjs/stargate: Add support for IBC message types in
  `SigningStargateClient`.
- @cosmjs/stargate: Added new `logs` export with all the functionality from
  @cosmjs/launchpad.
- @cosmjs/stargate: Added new `Coin`, `coin`, `coins` and `parseCoins` exports
  which have the same functionality as already existed in @cosmjs/launchpad.
- @cosmjs/amino: New package created that contains the shared amino signing
  functionality for @cosmjs/launchpad and @cosmjs/stargate.
- @cosmjs/amino: Split public key interfaces into `Pubkey`, `SinglePubkey` and
  `Secp256k1Pubkey` where `Pubkey` is a generalization of the old `PubKey` that
  supported nested pubkeys for multisig. `SinglePubkey` is the old `PubKey` in
  which the `value` is a base64 encoded string. And `Secp256k1Pubkey` is a
  single secp256k1 pubkey.
- @cosmjs/utils: The new `arrayContentStartsWith` works similar to
  `arrayContentEquals` but only checks the start of an array.
- @cosmjs/proto-signing: Added new `Coin`, `coin`, `coins` and `parseCoins`
  exports which have the same functionality as already existed in
  @cosmjs/launchpad.
- @cosmjs/stargate: Add `SigningStargateClient.sign`, which allows you to create
  signed transactions without broadcasting them directly. The new type
  `SignerData` can be passed into `.sign` to skip querying account number,
  sequence and chain ID
- @cosmjs/cosmwasm-stargate: Add `SigningCosmWasmClient.sign`, which allows you
  to create signed transactions without broadcasting them directly. The new type
  `SignerData` from @cosmjs/stargate can be passed into `.sign` to skip querying
  account number, sequence and chain ID.
- @cosmjs/stargate: Add constructor `SigningStargateClient.offline` which does
  not connect to Tendermint. This allows offline signing.
- @cosmjs/stargate: Add `makeMultisignedTx` which allows you to assemble a
  transaction signed by a multisig account.
- @cosmjs/stargate: Add `delegateTokens`, `undelegateTokens` and
  `withdrawRewards` methods to `SigningStargateClient`.
- @cosmjs/stargate: Export `defaultGasLimits` and `defaultGasPrice`.
- @cosmjs/cosmwasm-stargate: Export `defaultGasLimits`.
- @cosmjs/stargate: `SigningStargateClient` constructor is now `protected`.
- @cosmjs/cosmwasm-stargate: `SigningCosmWasmClient` constructor is now
  `protected`.
- @cosmjs/cosmwasm-stargate: Add `SigningCosmWasmClient.offline` static method
  for constructing offline clients without a Tendermint client.
- @cosmjs/stargate: Add `SigningStargateClient.sendIbcTokens` method.
- @cosmjs/amino: Export `Secp256k1HdWalletOptions` interface.
- @cosmjs/amino: Add `bip39Password` option to `Secp256k1HdWallet` options.
- @cosmjs/proto-signing: Export `DirectSecp256k1HdWalletOptions` interface.
- @cosmjs/proto-signing: Add `bip39Password` option to `DirectSecp256k1HdWallet`
  options.
- @cosmjs/amino: Add `rawEd25519PubkeyToRawAddress` helper function.
- @cosmjs/tendermint-rpc: Add `pubkeyToAddress`, `pubkeyToRawAddress`,
  `rawEd25519PubkeyToRawAddress`, and `rawSecp256k1PubkeyToRawAddress` helper
  functions.
- @cosmjs/stargate: `StargateClient.broadcastTx` and `.getTx` results now
  include `gasUsed` and `gasWanted` properties.
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.broadcastTx` and `.getTx` results
  now include `gasUsed` and `gasWanted` properties.
- @cosmjs/proto-signing: Export `DecodeObject` and `TxBodyEncodeObject`
  interfaces as well as `isTxBodyEncodeObject` helper function.
- @cosmjs/stargate: Add `MsgDelegateEncodeObject`, `MsgSendEncodeObject`,
  `MsgTransferEncodeObject`, `MsgUndelegateEncodeObject` and
  `MsgWithdrawDelegatorRewardEncodeObject` interfaces as well as
  `isMsgDelegateEncodeObject` etc helpers.
- @cosmjs/cosmwasm-stargate: Add `MsgClearAdminEncodeObject`,
  `MsgExecuteContractEncodeObject`, `MsgInstantiateContractEncodeObject`,
  `MsgMigrateContractEncodeObject`, `MsgStoreCodeEncodeObject` and
  `MsgUpdateAdminEncodeObject` interfaces as well as
  `isMsgClearAdminEncodeObject` etc helpers.
- @cosmjs/stargate: Add transfer queries codec, as well as transfer query
  methods to IBC query extension.
- @cosmjs/tendermint-rpc: Export `ValidatorSecp256k1Pubkey` interface.
- @cosmjs/proto-signing: Add transaction decoder `decodeTxRaw` for decoding
  transaction bytes returned by Tendermint (e.g. in `IndexedTx.tx`).

### Changed

- @cosmjs/cosmwasm-stargate: Codec adapted to support wasmd 0.16. Older versions
  of wasmd are not supported anymore.
- @cosmjs/stargate: Let `AuthExtension.account` and
  `AuthExtension.unverified.account` return an account of type `Any`. This makes
  the caller responsible for decoding the type.
- @cosmjs/stargate: Remove `accountFromProto` in favour of `accountFromAny`.
- @cosmjs/stargate: Rename `Rpc` interface to `ProtobufRpcClient` and
  `createRpc` to `createProtobufRpcClient`.
- @cosmjs/stargate: Reorganize nesting structure of IBC query client and add
  support for more methods.
- @cosmjs/tendermint-rpc: The fields `CommitSignature.validatorAddress`,
  `.timestamp` and `.signature` are now optional. They are unset when
  `blockIdFlag` is `BlockIdFlag.Absent`. The decoding into `CommitSignature` is
  only updated for the class `Tendermint34Client`, not for `Client`. Please
  migrate to the former.
- @cosmjs/launchpad: `rawSecp256k1PubkeyToAddress` was removed. Instead use
  `Bech32.encode(prefix, rawSecp256k1PubkeyToRawAddress(pubkeyRaw))` with
  `rawSecp256k1PubkeyToRawAddress` from @cosmjs/amino.
- @cosmjs/stargate: `parseRawLog` is now nested under the `logs` export.
- @cosmjs/stargate: Query extensions now have unverified queries at the root and
  verified queries nested under `.verified`.
- @cosmjs/cosmwasm-stargate: `wasm` extension now has unverified queries at the
  root.
- @cosmjs/stargate: `StargateClient.getAccount` now uses an unverified query and
  `StargateClient.getAccountUnverified` has been removed.
  `StargateClient.getAccountVerified` has been added, which performs a verified
  query.
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.getAccount` now uses an unverified
  query and `CosmWasmClient.getAccountUnverified` has been removed.
  `CosmWasmClient.getAccountVerified` has been added, which performs a verified
  query.
- @cosmjs/stargate: `StargateClient.getSequence` now rejects if the account is
  not found, instead of returning null.
- @cosmjs/stargate: `StargateClient.getBalance` now returns a 0 balance instead
  of null.
- @cosmjs/stargate: `StargateClient.getAllBalancesUnverified` has been renamed
  `.getAllBalances`.
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.getSequence` now rejects if the
  account is not found, instead of returning null.
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.getBalance` now returns a 0 balance
  instead of null.
- @cosmjs/amino: Options for `Secp256k1HdWallet.fromMnemonic` are now passed via
  a `Secp256k1HdWalletOptions` object.
- @cosmjs/proto-signing: Options for `DirectSecp256k1HdWallet.fromMnemonic` are
  now passed via a `DirectSecp256k1HdWalletOptions` object.
- @cosmjs/stargate: `StargateClient.broadcastTx` now uses sync mode and then
  polls for the transaction before resolving. The timeout and poll interval can
  be configured.
- @cosmjs/cosmwasm-stargate: `CosmWasmClient.broadcastTx` now uses sync mode and
  then polls for the transaction before resolving. The timeout and poll interval
  can be configured.
- @cosmjs/tendermint-rpc: Tendermint v34 `TxData` type now includes `codeSpace`,
  `gasWanted`, and `gasUsed` properties.
- @cosmjs/amino: `Secp256k1HdWallet.fromMnemonic` now accepts a
  `Secp256k1HdWalletOptions` argument which includes an array of `hdPaths`
  instead of a single `hdPath`. `Secp256k1HdWallet.generate` now also accepts
  options via this interface. This adds support for multiple accounts from the
  same mnemonic to `Secp256k1HdWallet`.
- @cosmjs/proto-signing: `DirectSecp256k1HdWallet.fromMnemonic` now accepts a
  `DirectSecp256k1HdWalletOptions` argument which includes an array of `hdPaths`
  instead of a single `hdPath`. `DirectSecp256k1HdWallet.generate` now also
  accepts options via this interface. This adds support for multiple accounts
  from the same mnemonic to `DirectSecp256k1HdWallet`.
- @cosmjs/tendermint-rpc: `ValidatorPubkey` is now a union of
  `ValidatorEd25519Pubkey` and the newly exported `ValidatorSecp256k1Pubkey`
  interface.
- @cosmjs/tendermint-rpc: `decodePubkey` now supports secp256k1 public keys.

### Deprecated

- @cosmjs/tendermint-rpc: `Client` has been deprecated. Launchpad applications
  do not need a Tendermint RPC client and Stargate applications should use
  `Tendermint34Client`.

### Removed

- @cosmjs/stargate: `coinFromProto` helper has been removed as it is no longer
  needed after the `ts-proto` migration.

## [0.24.1] - 2021-03-12

CHANGELOG entries missing. Please see [the diff][0.24.1].

## [0.24.0] - 2021-03-11

- @cosmjs/cosmwasm: This package is now deprecated. The same functionality is
  now available in @cosmjs/cosmwasm-launchpad.
- @cosmjs/cosmwasm: `logs` is no longer exported. Use `logs` from
  @cosmjs/launchpad instead.
- @cosmjs/cosmwasm: Export `JsonObject`, `ChangeAdminResult` and `WasmData`
  types as well as `isValidBuilder` and `parseWasmData` functions.
- @cosmjs/cosmwasm: Add `CosmWasmClient.getTx` method for searching by ID and
  remove such functionality from `CosmWasmClient.searchTx`.
- @cosmjs/cosmwasm: Rename `SigningCosmWasmClient.senderAddress` to
  `.signerAddress`.
- @cosmjs/cosmwasm-stargate: Add new package for CosmWasm Stargate support.
- @cosmjs/crypto: Change `Secp256k1Keypair` from tagged type to simple
  interface.
- @cosmjs/launchpad: Add `Secp256k1Wallet` to manage a single raw secp256k1
  keypair.
- @cosmjs/launchpad: `OfflineSigner` type’s `sign` method renamed `signAmino`
  and `SignResponse` type renamed `AminoSignResponse`.
- @cosmjs/launchpad: `Secp256k1HdWallet.sign` method renamed `signAmino`.
- @cosmjs/launchpad: Add `CosmosClient.getTx` method for searching by ID and
  remove such functionality from `CosmosClient.searchTx`.
- @cosmjs/launchpad: Add `SigningCosmosClient.sign` method for signing without
  broadcasting.
- @cosmjs/launchpad: Add `SigningCosmosClient.appendSignature` method creating
  transactions with multiple signatures.
- @cosmjs/launchpad: Add support for undefined memo in `makeSignDoc`.
- @cosmjs/launchpad: Rename `SigningCosmosClient.senderAddress` to
  `.signerAddress`.
- @cosmjs/proto-signing: Add new package for handling transaction signing with
  protobuf encoding.
- @cosmjs/proto-signing: Expose `DirectSignResponse` interface.
- @cosmjs/stargate: Add new package for Cosmos SDK Stargate support.
- @cosmjs/tendermint-rpc: Make `Client.detectVersion` private and let it return
  a version instead of a client.
- @cosmjs/tendermint-rpc: Make the constructor of `Client` private. Add
  `Client.create` for creating a Tendermint client given an RPC client and an
  optional adaptor.
- @cosmjs/tendermint-rpc: Add an optional adaptor argument to `Client.connect`
  which allows skipping the auto-detection.
- @cosmjs/tendermint-rpc: Remove export `v0_33` in favour of `adaptor33` and
  `adaptor34`. Export the `Adaptor` type.
- @cosmjs/tendermint-rpc: Export `DateTime` class.
- @cosmjs/tendermint-rpc: Remove types `QueryString`, `Base64String`,
  `HexString`, `IntegerString` and `IpPortString`. Use `string` instead.
- @cosmjs/tendermint-rpc: Remove types `BlockHash`, `TxBytes` and `TxHash`. Use
  `Uint8Array` instead.

### Added

- @cosmjs/launchpad: Export distribution module msg types
  `MsgFundCommunityPool`, `MsgSetWithdrawAddress`, `MsgWithdrawDelegatorReward`,
  `MsgWithdrawValidatorCommission` and type checker helper functions.
- @cosmjs/utils: Added `assertDefinedAndNotNull`.
- @cosmjs/tendermint-rpc: The new `Tendermint34Client` is a copy of the old
  `Client` but without the automatic version detection. Its usage is encouraged
  over `Client` if you connect to a Tendermint 0.34 backend.

### Changed

- @cosmjs/encoding: Change return type of `fromRfc3339` from `ReadonlyDate` to
  `Date` as the caller becomes the owner of the object and can safely mutate it
  in any way.
- @cosmjs/launchpad-ledger: Renamed to @cosmjs/ledger-amino.
- @cosmjs/ledger-amino: `LedgerSigner.sign` method renamed `signAmino`.

### Deprecated

- @cosmjs/tendermint-rpc: Deprecate `DateTime` in favour of the free functions
  `fromRfc3339WithNanoseconds` and `toRfc3339WithNanoseconds`.

## 0.23.2 (2021-01-06)

### Security

- @cosmjs/cli: Update vulnerable axios dependency.
- @cosmjs/faucet-client: Update vulnerable axios dependency.
- @cosmjs/launchpad: Update vulnerable axios dependency.
- @cosmjs/tendermint-rpc: Update vulnerable axios dependency.

## 0.23.1 (2020-10-27)

- @cosmjs/crypto: Export new convenience functions `keccak256`, `ripemd160`,
  `sha1`, `sha256` and `sha512`.
- @cosmjs/faucet-client: Add new package which exports `FaucetClient` class.

## 0.23.0 (2020-10-09)

- @cosmjs/cli: Expose `HdPath` type.
- @cosmjs/cosmwasm: Rename `CosmWasmClient.postTx` method to `.broadcastTx`.
- @cosmjs/cosmwasm: Rename `FeeTable` type to `CosmWasmFeeTable`.
- @cosmjs/cosmwasm: `SigningCosmWasmClient` constructor now takes optional
  arguments `gasPrice` and `gasLimits` instead of `customFees` for easier
  customization.
- @cosmjs/cosmwasm: Rename `SigningCosmWasmClient.signAndPost` method to
  `.signAndBroadcast`.
- @cosmjs/cosmwasm: Use stricter type `Record<string, unknown>` for smart query,
  init, migrate and handle messages (in `WasmExtension.wasm.queryContractSmart`,
  `CosmWasmClient.queryContractSmart`, `SigningCosmWasmClient.instantiate`,
  `SigningCosmWasmClient.migrate`, `SigningCosmWasmClient.execute`).
- @cosmjs/crypto: Export new type alias `HdPath`.
- @cosmjs/crypto: Add `Secp256k1Signature.toFixedLength` method.
- @cosmjs/demo-staking: Remove package and supporting scripts.
- @cosmjs/encoding: Add `limit` parameter to `Bech32.encode` and `.decode`. The
  new default limit for decoding is infinity (was 90 before). Set it to 90 to
  create a strict decoder.
- @cosmjs/faucet: Environmental variable `FAUCET_FEE` renamed to
  `FAUCET_GAS_PRICE` and now only accepts one token. Environmental variable
  `FAUCET_GAS` renamed to `FAUCET_GAS_LIMIT`.
- @cosmjs/faucet: `/credit` API now expects `denom` (base token) instead of
  `ticker` (unit token). Environmental variables specifying credit amounts now
  need to use uppercase denom.
- @cosmjs/launchpad: Rename `FeeTable` type to `CosmosFeeTable` and export a new
  more generic type `FeeTable`.
- @cosmjs/launchpad: Add new class `GasPrice`, new helper type `GasLimits` and
  new helper function `buildFeeTable` for easier handling of gas prices and
  fees.
- @cosmjs/launchpad: Rename `CosmosClient.postTx` method to `.broadcastTx`.
- @cosmjs/launchpad: `SigningCosmosClient` constructor now takes optional
  arguments `gasPrice` and `gasLimits` instead of `customFees` for easier
  customization.
- @cosmjs/launchpad: Rename `SigningCosmosClient.signAndPost` method to
  `.signAndBroadcast`.
- @cosmjs/launchpad: Rename `PostTx`-related types to `BroadcastTxResult`,
  `BroadcastTxSuccess` and `BroadcastTxFailure` respectively, as well as helper
  functions `isBroadcastTxFailure`, `isBroadcastTxSuccess` and
  `assertIsBroadcastTxSuccess`.
- @cosmjs/launchpad: Export `isSearchByIdQuery`, `isSearchByHeightQuery`,
  `isSearchBySentFromOrToQuery` and `isSearchByTagsQuery`.
- @cosmjs/launchpad: Change type of `TxsResponse.logs` and
  `BroadcastTxsResponse.logs` to `unknown[]`.
- @cosmjs/launchpad: Export `StdSignDoc` and create helpers to make and
  serialize a `StdSignDoc`: `makeSignDoc` and `serializeSignDoc`.
- @cosmjs/launchpad: Let `OfflineSigner.sign` take an `StdSignDoc` instead of an
  encoded message and return a `SignResponse` that includes the document which
  was signed.
- @cosmjs/launchpad: Remove `PrehashType` and the prehash type argument in
  `OfflineSigner.sign` because the signer now needs to know how to serialize an
  `StdSignDoc`.
- @cosmjs/launchpad: Remove `makeSignBytes` in favour of `makeSignDoc` and
  `serializeSignDoc`.
- @cosmjs/launchpad: Create `WrappedTx`, `WrappedStdTx` and `isWrappedStdTx` to
  better represent the Amino tx interface. Deprecate `CosmosSdkTx`, which is an
  alias for `WrappedStdTx`.
- @cosmjs/launchpad: Add `makeStdTx` to create an `StdTx`.
- @cosmjs/launchpad: Rename `Secp256k1Wallet` to `Secp256k1HdWallet`. Later on,
  we'll use `Secp256k1Wallet` for single key wallets.
- @cosmjs/launchpad-ledger: Add package supporting Ledger device integration for
  Launchpad. Two new classes are provided: `LedgerSigner` (for most use cases)
  and `LaunchpadLedger` for more fine-grained access.
- @cosmjs/math: Add `.multiply` method to `Decimal` class.
- @cosmjs/math: Deprecate `Uint32.fromBigEndianBytes` in favour of
  `Uint32.fromBytes`, which supports both big and little endian.
- @cosmjs/math: Deprecate `Uint64.fromBytesBigEndian` in favour of
  `Uint64.fromBytes`, which supports both big and little endian.
- @cosmjs/math: Add `Uint32.fromString`.
- @cosmjs/tendermint-rpc: Make `BroadcastTxCommitResponse.height` non-optional.
- @cosmjs/tendermint-rpc: Make `TxProof.proof.leafHash` non-optional because it
  is always set.
- @cosmjs/tendermint-rpc: Change type of `GenesisResponse.appState` to
  `Record<string, unknown> | undefined`.
- @cosmjs/tendermint-rpc: Remove obsolete `TxData.tags` and make `TxData.events`
  non-optional. Rename `Tag` to `Attribute`.
- @cosmjs/tendermint-rpc: Remove obsolete `BlockResultsResponse.beginBlock` and
  `.beginBlock`. The new `.beginBlockEvents` and `.endBlockEvents` now parse the
  events correctly.
- @cosmjs/tendermint-rpc: Remove trivial helpers `getTxEventHeight`,
  `getHeaderEventHeight` and `getBlockEventHeight` because they don't do
  anything else than accessing an object member.
- @cosmjs/tendermint-rpc: Add support for connecting to Tendermint RPC 0.34.
- @cosmjs/tendermint-rpc: Make `TxEvent.index` optional and deprecate it because
  it is not set anymore in Tendermint 0.34.
- @cosmjs/utils: Add `assertDefined`.
- @cosmjs/faucet: Rename binary from `cosmwasm-faucet` to `cosmos-faucet`.

## 0.22.3 (2020-09-15)

- @cosmjs/math: Add `Decimal.minus`.

## 0.22.2 (2020-08-11)

- @cosmjs/faucet: Log errors for failed send transactions.
- @cosmjs/faucet: Add config variable `FAUCET_MEMO`.
- @cosmjs/faucet: Add config variables `FAUCET_FEE` and `FAUCET_GAS`.
- @cosmjs/launchpad: Add `parseCoins` helper.

## 0.22.1 (2020-08-11)

- @cosmjs/cli: Import `encodeAminoPubkey`, `encodeBech32Pubkey`,
  `decodeAminoPubkey` and `decodeBech32Pubkey` by default.
- @cosmjs/launchpad: Add ed25519 support to `encodeBech32Pubkey`.
- @cosmjs/launchpad: Add `encodeAminoPubkey` and `decodeAminoPubkey`.
- @cosmjs/utils: Add `arrayContentEquals`.
- @cosmjs/faucet: Add config variables `FAUCET_ADDRESS_PREFIX` and
  `FAUCET_TOKENS`.
- @cosmjs/faucet: Remove broken chain ID from `cosmwasm-faucet generate`.

## 0.22.0 (2020-08-03)

- @cosmjs/cli: Now supports HTTPs URLs for `--init` code sources.
- @cosmjs/cli: Now supports adding code directly via `--code`.
- @cosmjs/cosmwasm: Rename `CosmWasmClient.getNonce` method to `.getSequence`.
- @cosmjs/cosmwasm: Remove `RestClient` class in favour of new modular
  `LcdClient` class from @cosmjs/sdk38.
- @cosmjs/cosmwasm: Add `SigningCosmWasmClient.signAndPost` as a mid-level
  abstraction between `SigningCosmWasmClient.upload`/`.instantiate`/`.execute`
  and `.postTx`.
- @cosmjs/cosmwasm: Use `*PostTx*` types and helpers from @cosmjs/sdk38. Remove
  exported `PostTxResult`.
- @cosmjs/cosmwasm: `ContractDetails` was removed in favour of just `Contract`.
  The missing `init_msg` is now available via the contract's code history (see
  `getContractCodeHistory`).
- @cosmjs/cosmwasm: Remove `SigningCallback` in favour of the `OfflineSigner`
  interface.
- @cosmjs/sdk38: Rename `CosmosClient.getNonce` method to `.getSequence`.
- @cosmjs/sdk38: Remove `RestClient` class in favour of new modular `LcdClient`
  class.
- @cosmjs/sdk38: Remove `Pen` type in favour of `OfflineSigner` and remove
  `Secp256k1Pen` class in favour of `Secp256k1Wallet` which takes an
  `OfflineSigner` instead of a `SigningCallback`.
- @cosmjs/sdk38: Rename `CosmosSdkAccount` to `BaseAccount` and export the type.
- @cosmjs/sdk38: `BaseAccount` now uses `number | string` as the type for
  `account_number` and `sequence`. The new helpers `uint64ToNumber` and
  `uint64ToString` allow you to normalize the mixed input.
- @cosmjs/sdk38: `BaseAccount` now uses `string | PubKey | null` as the type for
  `public_key`. The new helper `normalizePubkey` allows you to normalize the
  mixed input.
- @cosmjs/math: Add missing integer check to `Uint64.fromNumber`. Before
  `Uint64.fromNumber(1.1)` produced some result.
- @cosmjs/sdk38: Add `SigningCosmosClient.signAndPost` as a mid-level
  abstraction between `SigningCosmosClient.sendTokens` and `.postTx`.
- @cosmjs/sdk38: Export `PostTxFailure`/`PostTxSuccess` and type checkers
  `isPostTxFailure`/`isPostTxSuccess`; export `assertIsPostTxSuccess`.
- @cosmjs/sdk38: `Secp256k1Wallet`s can now be generated randomly with
  `Secp256k1Wallet.generate(n)` where `n` is 12, 15, 18, 21 or 24 mnemonic
  words.
- @cosmjs/sdk38: The new `Secp256k1Wallet.serialize` and `.deserialize` allow
  encrypted serialization of the wallet.
- @cosmjs/sdk38: Remove the obsolete `upload`, `init`, `exec` properties from
  `FeeTable`. @cosmjs/cosmwasm has its own `FeeTable` with those properties.
- @cosmjs/sdk38: Rename package to @cosmjs/launchpad.

[unreleased]: https://github.com/cosmos/cosmjs/compare/v0.32.4...HEAD
[0.32.4]: https://github.com/cosmos/cosmjs/compare/v0.32.3...v0.32.4
[0.32.3]: https://github.com/cosmos/cosmjs/compare/v0.32.2...v0.32.3
[0.32.2]: https://github.com/cosmos/cosmjs/compare/v0.32.1...v0.32.2
[0.32.1]: https://github.com/cosmos/cosmjs/compare/v0.32.0...v0.32.1
[0.32.0]: https://github.com/cosmos/cosmjs/compare/v0.31.3...v0.32.0
[0.31.3]: https://github.com/cosmos/cosmjs/compare/v0.31.2...v0.31.3
[0.31.2]: https://github.com/cosmos/cosmjs/compare/v0.31.1...v0.31.2
[0.31.1]: https://github.com/cosmos/cosmjs/compare/v0.31.0...v0.31.1
[0.31.0]: https://github.com/cosmos/cosmjs/compare/v0.30.1...v0.31.0
[0.30.1]: https://github.com/cosmos/cosmjs/compare/v0.30.0...v0.30.1
[0.30.0]: https://github.com/cosmos/cosmjs/compare/v0.29.5...v0.30.0
[0.29.5]: https://github.com/cosmos/cosmjs/compare/v0.29.4...v0.29.5
[0.29.4]: https://github.com/cosmos/cosmjs/compare/v0.29.3...v0.29.4
[0.29.3]: https://github.com/cosmos/cosmjs/compare/v0.29.2...v0.29.3
[0.29.2]: https://github.com/cosmos/cosmjs/compare/v0.29.1...v0.29.2
[0.29.1]: https://github.com/cosmos/cosmjs/compare/v0.29.0...v0.29.1
[0.29.0]: https://github.com/cosmos/cosmjs/compare/v0.28.11...v0.29.0
[0.28.11]: https://github.com/cosmos/cosmjs/compare/v0.28.10...v0.28.11
[0.28.10]: https://github.com/cosmos/cosmjs/compare/v0.28.9...v0.28.10
[0.28.9]: https://github.com/cosmos/cosmjs/compare/v0.28.8...v0.28.9
[0.28.8]: https://github.com/cosmos/cosmjs/compare/v0.28.7...v0.28.8
[0.28.7]: https://github.com/cosmos/cosmjs/compare/v0.28.6...v0.28.7
[0.28.6]: https://github.com/cosmos/cosmjs/compare/v0.28.5...v0.28.6
[0.28.5]: https://github.com/cosmos/cosmjs/compare/v0.28.4...v0.28.5
[0.28.4]: https://github.com/cosmos/cosmjs/compare/v0.28.3...v0.28.4
[0.28.3]: https://github.com/cosmos/cosmjs/compare/v0.28.2...v0.28.3
[0.28.2]: https://github.com/cosmos/cosmjs/compare/v0.28.1...v0.28.2
[0.28.1]: https://github.com/cosmos/cosmjs/compare/v0.28.0...v0.28.1
[0.28.0]: https://github.com/cosmos/cosmjs/compare/v0.27.1...v0.28.0
[0.27.1]: https://github.com/cosmos/cosmjs/compare/v0.27.0...v0.27.1
[0.27.0]: https://github.com/cosmos/cosmjs/compare/v0.26.6...v0.27.0
[0.26.6]: https://github.com/cosmos/cosmjs/compare/v0.26.5...v0.26.6
[0.26.5]: https://github.com/cosmos/cosmjs/compare/v0.26.4...v0.26.5
[0.26.4]: https://github.com/cosmos/cosmjs/compare/v0.26.3...v0.26.4
[0.26.3]: https://github.com/cosmos/cosmjs/compare/v0.26.2...v0.26.3
[0.26.2]: https://github.com/cosmos/cosmjs/compare/v0.26.1...v0.26.2
[0.26.1]: https://github.com/cosmos/cosmjs/compare/v0.26.0...v0.26.1
[0.26.0]: https://github.com/cosmos/cosmjs/compare/v0.25.6...v0.26.0
[0.25.6]: https://github.com/cosmos/cosmjs/compare/v0.25.5...v0.25.6
[0.25.5]: https://github.com/cosmos/cosmjs/compare/v0.25.4...v0.25.5
[0.25.4]: https://github.com/cosmos/cosmjs/compare/v0.25.3...v0.25.4
[0.25.3]: https://github.com/cosmos/cosmjs/compare/v0.25.2...v0.25.3
[0.25.2]: https://github.com/cosmos/cosmjs/compare/v0.25.1...v0.25.2
[0.25.1]: https://github.com/cosmos/cosmjs/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/cosmos/cosmjs/compare/v0.24.1...v0.25.0
[0.24.1]: https://github.com/cosmos/cosmjs/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/cosmos/cosmjs/compare/v0.23.0...v0.24.0
