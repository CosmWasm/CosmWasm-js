# CHANGELOG

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- @cosmjs/tendermint-rpc: `Tendermint34Client.blockSearch` and
  `Tendermint34Client.blockSearchAll` were added to allow searching blocks in
  Tendermint 0.34.9+ backends.
- @cosmjs/tendermint-rpc: `Tendermint33Client` has been added to provide support
  for Tendermint v0.33.
- @cosmjs/tendermint-rpc: Exports relating to `Tendermint33Client` are now
  available under `tendermint33`.
- @cosmjs/amino: Added `StdTx`, `isStdTx` and `makeStdTx` and removed them from
  @cosmjs/launchpad. They are re-exported in @cosmjs/launchpad for backwards
  compatibility.

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

### Removed

- Node.js v10 is no longer supported. Please use v12 or later.
- @cosmjs/cosmwasm-stargate: Remove `CosmWasmFeeTable` type and
  `defaultGasLimits` object.
- @cosmjs/stargate: Remove types, objects and functions to do with default fees:
  `CosmosFeeTable`, `FeeTable`, `GasLimits`, `defaultGasLimits`,
  `defaultGasPrice` and `buildFeeTable`.
- @cosmjs/tendermint-rpc: `Client` has been removed. Please use
  `Tendermint33Client` or `Tendermint34Client`, depending on your needs.

### Fixed

- @cosmjs/socket: Upgrade dependency "ws" to version 7 to avoid potential
  security problems.

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

[unreleased]: https://github.com/cosmos/cosmjs/compare/v0.25.3...HEAD
[0.25.5]: https://github.com/cosmos/cosmjs/compare/v0.25.4...v0.25.5
[0.25.4]: https://github.com/cosmos/cosmjs/compare/v0.25.3...v0.25.4
[0.25.3]: https://github.com/cosmos/cosmjs/compare/v0.25.2...v0.25.3
[0.25.2]: https://github.com/cosmos/cosmjs/compare/v0.25.1...v0.25.2
[0.25.1]: https://github.com/cosmos/cosmjs/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/cosmos/cosmjs/compare/v0.24.1...v0.25.0
[0.24.1]: https://github.com/cosmos/cosmjs/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/cosmos/cosmjs/compare/v0.23.0...v0.24.0
