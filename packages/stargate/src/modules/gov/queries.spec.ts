import { coin, coins, makeCosmoshubPath } from "@cosmjs/amino";
import { toAscii } from "@cosmjs/encoding";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";
import { assert, sleep } from "@cosmjs/utils";
import {
  ProposalStatus,
  TextProposal,
  Vote,
  VoteOption,
  WeightedVoteOption,
} from "cosmjs-types/cosmos/gov/v1beta1/gov";
import { Any } from "cosmjs-types/google/protobuf/any";

import { longify, QueryClient } from "../../queryclient";
import { SigningStargateClient } from "../../signingstargateclient";
import { assertIsDeliverTxSuccess } from "../../stargateclient";
import {
  defaultSigningClientOptions,
  faucet,
  nonNegativeIntegerMatcher,
  pendingWithoutSimapp,
  simapp,
  simapp44Enabled,
  simappEnabled,
  validator,
} from "../../testutils.spec";
import { MsgDelegateEncodeObject, MsgSubmitProposalEncodeObject, MsgVoteEncodeObject } from "../";
import { GovExtension, setupGovExtension } from "./queries";

async function makeClientWithGov(rpcUrl: string): Promise<[QueryClient & GovExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupGovExtension), cometClient];
}

describe("GovExtension", () => {
  const defaultFee = {
    amount: coins(25000, "ucosm"),
    gas: "1500000", // 1.5 million
  };
  const textProposal = TextProposal.fromPartial({
    title: "Test Proposal",
    description: "This proposal proposes to test whether this proposal passes",
  });
  const initialDeposit = coins(12300000, "ustake");
  const delegationVoter1 = coin(424242, "ustake");
  const delegationVoter2 = coin(777, "ustake");
  const voter1Address = faucet.address1;
  const voter2Address = faucet.address2;
  let proposalId: string | undefined;

  beforeAll(async () => {
    if (simappEnabled()) {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(faucet.mnemonic, {
        // Use address 1 and 2 instead of 0 to avoid conflicts with other delegation tests
        // This must match `voterAddress` above.
        hdPaths: [makeCosmoshubPath(1), makeCosmoshubPath(2)],
      });
      const client = await SigningStargateClient.connectWithSigner(
        simapp.tendermintUrl,
        wallet,
        defaultSigningClientOptions,
      );

      const proposalMsg: MsgSubmitProposalEncodeObject = {
        typeUrl: "/cosmos.gov.v1beta1.MsgSubmitProposal",
        value: {
          content: Any.fromPartial({
            typeUrl: "/cosmos.gov.v1beta1.TextProposal",
            value: Uint8Array.from(TextProposal.encode(textProposal).finish()),
          }),
          proposer: voter1Address,
          initialDeposit: initialDeposit,
        },
      };
      const proposalResult = await client.signAndBroadcast(
        voter1Address,
        [proposalMsg],
        defaultFee,
        "Test proposal for simd",
      );
      assertIsDeliverTxSuccess(proposalResult);

      proposalId = proposalResult.events
        .find(({ type }) => type === "submit_proposal")
        ?.attributes.find(({ key }: any) => key === "proposal_id")?.value;
      assert(proposalId, "Proposal ID not found in events");
      assert(proposalId.match(nonNegativeIntegerMatcher));

      // Voter 1
      {
        // My vote only counts when I delegate
        if (!(await client.getDelegation(voter1Address, validator.validatorAddress))) {
          const msgDelegate: MsgDelegateEncodeObject = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
              delegatorAddress: voter1Address,
              validatorAddress: validator.validatorAddress,
              amount: delegationVoter1,
            },
          };
          const result = await client.signAndBroadcast(voter1Address, [msgDelegate], defaultFee);
          assertIsDeliverTxSuccess(result);
        }

        const voteMsg: MsgVoteEncodeObject = {
          typeUrl: "/cosmos.gov.v1beta1.MsgVote",
          value: {
            proposalId: longify(proposalId),
            voter: voter1Address,
            option: VoteOption.VOTE_OPTION_YES,
          },
        };
        const voteResult = await client.signAndBroadcast(voter1Address, [voteMsg], defaultFee);
        assertIsDeliverTxSuccess(voteResult);
      }

      // Voter 2
      {
        // My vote only counts when I delegate
        if (!(await client.getDelegation(voter2Address, validator.validatorAddress))) {
          const msgDelegate: MsgDelegateEncodeObject = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: {
              delegatorAddress: voter2Address,
              validatorAddress: validator.validatorAddress,
              amount: delegationVoter2,
            },
          };
          const result = await client.signAndBroadcast(voter2Address, [msgDelegate], defaultFee);
          assertIsDeliverTxSuccess(result);
        }

        const voteMsg: MsgVoteEncodeObject = {
          typeUrl: "/cosmos.gov.v1beta1.MsgVote",
          value: {
            proposalId: longify(proposalId),
            voter: voter2Address,
            option: VoteOption.VOTE_OPTION_NO_WITH_VETO,
          },
        };
        const voteResult = await client.signAndBroadcast(voter2Address, [voteMsg], defaultFee);
        assertIsDeliverTxSuccess(voteResult);
      }

      await sleep(75); // wait until transactions are indexed

      client.disconnect();
    }
  });

  describe("params", () => {
    it("works for deposit", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.params("deposit");
      expect(response).toEqual(
        jasmine.objectContaining({
          depositParams: {
            minDeposit: simapp.govMinDeposit,
            maxDepositPeriod: {
              seconds: BigInt(172800),
              nanos: 0,
            },
          },
        }),
      );

      cometClient.disconnect();
    });

    it("works for tallying", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.params("tallying");
      expect(response).toEqual(
        jasmine.objectContaining({
          tallyParams: {
            // Why the f*** are we getting binary values here?
            quorum: toAscii("334000000000000000"), // 0.334
            threshold: toAscii("500000000000000000"), // 0.5
            vetoThreshold: toAscii("334000000000000000"), // 0.334
          },
        }),
      );

      cometClient.disconnect();
    });

    it("works for voting", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.params("voting");
      expect(response).toEqual(
        jasmine.objectContaining({
          votingParams: {
            votingPeriod: {
              seconds: BigInt(172800),
              nanos: 0,
            },
          },
        }),
      );

      cometClient.disconnect();
    });
  });

  describe("proposals", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.proposals(
        ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        voter1Address,
        voter1Address,
      );
      expect(response.proposals.length).toBeGreaterThanOrEqual(1);
      expect(response.proposals[response.proposals.length - 1]).toEqual({
        content: Any.fromPartial({
          typeUrl: "/cosmos.gov.v1beta1.TextProposal",
          value: Uint8Array.from(TextProposal.encode(textProposal).finish()),
        }),
        proposalId: longify(proposalId),
        status: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        finalTallyResult: { yes: "0", abstain: "0", no: "0", noWithVeto: "0" },
        submitTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        depositEndTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        totalDeposit: initialDeposit,
        votingStartTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        votingEndTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
      });

      cometClient.disconnect();
    });
  });

  describe("proposal", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.proposal(proposalId);
      expect(response.proposal).toEqual({
        content: Any.fromPartial({
          typeUrl: "/cosmos.gov.v1beta1.TextProposal",
          value: Uint8Array.from(TextProposal.encode(textProposal).finish()),
        }),
        proposalId: longify(proposalId),
        status: ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        finalTallyResult: { yes: "0", abstain: "0", no: "0", noWithVeto: "0" },
        // Note: jasmine.any(Bigint) does not seem to work as expected in Jasmine 4.6
        submitTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        depositEndTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        totalDeposit: initialDeposit,
        votingStartTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
        votingEndTime: { seconds: jasmine.anything(), nanos: jasmine.any(Number) },
      });

      cometClient.disconnect();
    });
  });

  describe("deposits", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.deposits(proposalId);
      expect(response.deposits).toEqual([
        {
          proposalId: longify(proposalId),
          depositor: voter1Address,
          amount: initialDeposit,
        },
      ]);

      cometClient.disconnect();
    });
  });

  describe("deposit", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.deposit(proposalId, voter1Address);
      expect(response.deposit).toEqual({
        proposalId: longify(proposalId),
        depositor: voter1Address,
        amount: initialDeposit,
      });

      cometClient.disconnect();
    });
  });

  describe("tally", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.tally(proposalId);
      expect(response.tally).toEqual({
        yes: delegationVoter1.amount,
        abstain: "0",
        no: "0",
        noWithVeto: delegationVoter2.amount,
      });

      cometClient.disconnect();
    });
  });

  describe("votes", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.votes(proposalId);

      expect(response.votes).toEqual([
        // why is vote 2 first?
        Vote.fromPartial({
          proposalId: longify(proposalId),
          voter: voter2Address,
          option: simapp44Enabled()
            ? VoteOption.VOTE_OPTION_NO_WITH_VETO
            : VoteOption.VOTE_OPTION_UNSPECIFIED,
          options: [
            WeightedVoteOption.fromPartial({
              option: VoteOption.VOTE_OPTION_NO_WITH_VETO,
              weight: "1000000000000000000",
            }),
          ],
        }),
        Vote.fromPartial({
          proposalId: longify(proposalId),
          voter: voter1Address,
          option: simapp44Enabled() ? VoteOption.VOTE_OPTION_YES : VoteOption.VOTE_OPTION_UNSPECIFIED,
          options: [
            WeightedVoteOption.fromPartial({
              option: VoteOption.VOTE_OPTION_YES,
              weight: "1000000000000000000",
            }),
          ],
        }),
      ]);

      cometClient.disconnect();
    });
  });

  describe("vote", () => {
    it("works", async () => {
      pendingWithoutSimapp();
      assert(proposalId, "Missing proposal ID");
      const [client, cometClient] = await makeClientWithGov(simapp.tendermintUrl);

      const response = await client.gov.vote(proposalId, voter1Address);
      expect(response.vote).toEqual(
        Vote.fromPartial({
          voter: voter1Address,
          proposalId: longify(proposalId),
          option: simapp44Enabled() ? VoteOption.VOTE_OPTION_YES : VoteOption.VOTE_OPTION_UNSPECIFIED,
          options: [
            WeightedVoteOption.fromPartial({
              option: VoteOption.VOTE_OPTION_YES,
              weight: "1000000000000000000",
            }),
          ],
        }),
      );

      cometClient.disconnect();
    });
  });
});
