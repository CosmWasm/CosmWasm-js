import { GeneratedType } from "@cosmjs/proto-signing";

import { AminoConverters } from "../aminotypes";
import { createStakingAminoConverters } from "./staking/aminomessages";
import { stakingTypes } from "./staking/messages";
import { setupStakingExtension } from "./staking/queries";
import { setupTxExtension } from "./tx/queries";
import { createVestingAminoConverters } from "./vesting/aminomessages";
import { vestingTypes } from "./vesting/messages";

export { AuthExtension, setupAuthExtension } from "./auth/queries";
export { createAuthzAminoConverters } from "./authz/aminomessages";
export { authzTypes } from "./authz/messages";
export { setupAuthzExtension } from "./authz/queries";
export {
  AminoMsgMultiSend,
  AminoMsgSend,
  createBankAminoConverters,
  isAminoMsgMultiSend,
  isAminoMsgSend,
} from "./bank/aminomessages";
export { bankTypes, isMsgSendEncodeObject, MsgSendEncodeObject } from "./bank/messages";
export { BankExtension, setupBankExtension } from "./bank/queries";
export {
  AminoMsgVerifyInvariant,
  createCrysisAminoConverters,
  isAminoMsgVerifyInvariant,
} from "./crisis/aminomessages";
export {
  AminoMsgFundCommunityPool,
  AminoMsgSetWithdrawAddress,
  AminoMsgWithdrawDelegatorReward,
  AminoMsgWithdrawValidatorCommission,
  createDistributionAminoConverters,
  isAminoMsgFundCommunityPool,
  isAminoMsgSetWithdrawAddress,
  isAminoMsgWithdrawDelegatorReward,
  isAminoMsgWithdrawValidatorCommission,
} from "./distribution/aminomessages";
export {
  distributionTypes,
  isMsgWithdrawDelegatorRewardEncodeObject,
  MsgWithdrawDelegatorRewardEncodeObject,
} from "./distribution/messages";
export { DistributionExtension, setupDistributionExtension } from "./distribution/queries";
export {
  AminoMsgSubmitEvidence,
  createEvidenceAminoConverters,
  isAminoMsgSubmitEvidence,
} from "./evidence/aminomessages";
export { createFeegrantAminoConverters } from "./feegrant/aminomessages";
export { feegrantTypes } from "./feegrant/messages";
export { FeegrantExtension, setupFeegrantExtension } from "./feegrant/queries";
export {
  AminoMsgDeposit,
  AminoMsgSubmitProposal,
  AminoMsgVote,
  AminoMsgVoteWeighted,
  createGovAminoConverters,
  isAminoMsgDeposit,
  isAminoMsgSubmitProposal,
  isAminoMsgVote,
  isAminoMsgVoteWeighted,
} from "./gov/aminomessages";
export {
  govTypes,
  isMsgDepositEncodeObject,
  isMsgSubmitProposalEncodeObject,
  isMsgVoteEncodeObject,
  isMsgVoteWeightedEncodeObject,
  MsgDepositEncodeObject,
  MsgSubmitProposalEncodeObject,
  MsgVoteEncodeObject,
  MsgVoteWeightedEncodeObject,
} from "./gov/messages";
export { GovExtension, GovParamsType, GovProposalId, setupGovExtension } from "./gov/queries";
export { createGroupAminoConverters } from "./group/aminomessages";
export { groupTypes } from "./group/messages";
export { AminoMsgTransfer, createIbcAminoConverters, isAminoMsgTransfer } from "./ibc/aminomessages";
export { ibcTypes, isMsgTransferEncodeObject, MsgTransferEncodeObject } from "./ibc/messages";
export { IbcExtension, setupIbcExtension } from "./ibc/queries";
export { MintExtension, MintParams, setupMintExtension } from "./mint/queries";
export { AminoMsgUnjail, createSlashingAminoConverters, isAminoMsgUnjail } from "./slashing/aminomessages";
export { setupSlashingExtension, SlashingExtension } from "./slashing/queries";
export {
  AminoMsgBeginRedelegate,
  AminoMsgCreateValidator,
  AminoMsgDelegate,
  AminoMsgEditValidator,
  AminoMsgUndelegate,
  createStakingAminoConverters,
  isAminoMsgBeginRedelegate,
  isAminoMsgCreateValidator,
  isAminoMsgDelegate,
  isAminoMsgEditValidator,
  isAminoMsgUndelegate,
} from "./staking/aminomessages";
export {
  isMsgBeginRedelegateEncodeObject,
  isMsgCancelUnbondingDelegationEncodeObject,
  isMsgCreateValidatorEncodeObject,
  isMsgDelegateEncodeObject,
  isMsgEditValidatorEncodeObject,
  isMsgUndelegateEncodeObject,
  MsgBeginRedelegateEncodeObject,
  MsgCancelUnbondingDelegationEncodeObject,
  MsgCreateValidatorEncodeObject,
  MsgDelegateEncodeObject,
  MsgEditValidatorEncodeObject,
  MsgUndelegateEncodeObject,
  stakingTypes,
} from "./staking/messages";
export { setupStakingExtension, StakingExtension } from "./staking/queries";
export { setupTxExtension, TxExtension } from "./tx/queries";
export {
  AminoMsgCreateVestingAccount,
  createVestingAminoConverters,
  isAminoMsgCreateVestingAccount,
} from "./vesting/aminomessages";
export { vestingTypes } from "./vesting/messages";

interface Module<CreateAminoConverters extends ((...args: any[]) => AminoConverters) | null, SetupQuery> {
  readonly messageTypes: ReadonlyArray<[string, GeneratedType]> | null;
  readonly createAminoConverters: CreateAminoConverters;
  readonly setupQueryExtension: SetupQuery;
}

export const vesting: Module<typeof createVestingAminoConverters, null> = {
  messageTypes: vestingTypes,
  createAminoConverters: createVestingAminoConverters,
  setupQueryExtension: null,
};

export const staking: Module<typeof createStakingAminoConverters, typeof setupStakingExtension> = {
  messageTypes: stakingTypes,
  createAminoConverters: createStakingAminoConverters,
  setupQueryExtension: setupStakingExtension,
};

export const tx: Module<null, typeof setupTxExtension> = {
  messageTypes: null,
  createAminoConverters: null,
  setupQueryExtension: setupTxExtension,
};
