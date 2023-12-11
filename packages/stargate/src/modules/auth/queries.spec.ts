/* eslint-disable @typescript-eslint/naming-convention */
import { encodePubkey } from "@cosmjs/proto-signing";
import { CometClient, connectComet } from "@cosmjs/tendermint-rpc";
import { assert } from "@cosmjs/utils";
import { BaseAccount } from "cosmjs-types/cosmos/auth/v1beta1/auth";
import { Any } from "cosmjs-types/google/protobuf/any";

import { QueryClient } from "../../queryclient";
import { nonExistentAddress, pendingWithoutSimapp, simapp, unused, validator } from "../../testutils.spec";
import { AuthExtension, setupAuthExtension } from "./queries";

async function makeClientWithAuth(rpcUrl: string): Promise<[QueryClient & AuthExtension, CometClient]> {
  const cometClient = await connectComet(rpcUrl);
  return [QueryClient.withExtensions(cometClient, setupAuthExtension), cometClient];
}

describe("AuthExtension", () => {
  describe("account", () => {
    it("works for unused account", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithAuth(simapp.tendermintUrl);
      const account = await client.auth.account(unused.address);
      assert(account);

      expect(account.typeUrl).toEqual("/cosmos.auth.v1beta1.BaseAccount");
      expect(BaseAccount.decode(account.value)).toEqual(
        jasmine.objectContaining({
          address: unused.address,
          accountNumber: BigInt(unused.accountNumber),
          sequence: BigInt(0),
        }),
      );

      cometClient.disconnect();
    });

    it("works for account with pubkey and non-zero sequence", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithAuth(simapp.tendermintUrl);
      const account = await client.auth.account(validator.delegatorAddress);
      assert(account);

      expect(account.typeUrl).toEqual("/cosmos.auth.v1beta1.BaseAccount");
      expect(BaseAccount.decode(account.value)).toEqual({
        address: validator.delegatorAddress,
        pubKey: Any.fromPartial(encodePubkey(validator.pubkey)),
        accountNumber: BigInt(0),
        sequence: BigInt(validator.sequence),
      });

      cometClient.disconnect();
    });

    it("rejects for non-existent address", async () => {
      pendingWithoutSimapp();
      const [client, cometClient] = await makeClientWithAuth(simapp.tendermintUrl);

      await expectAsync(client.auth.account(nonExistentAddress)).toBeRejectedWithError(
        /account cosmos1p79apjaufyphcmsn4g07cynqf0wyjuezqu84hd not found/i,
      );

      cometClient.disconnect();
    });
  });
});
