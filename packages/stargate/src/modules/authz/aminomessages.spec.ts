import { MsgExec, MsgGrant, MsgRevoke } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { SendAuthorization } from "cosmjs-types/cosmos/bank/v1beta1/authz";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";

import { AminoTypes } from "../../aminotypes";
import { AminoMsgExec, AminoMsgGrant, AminoMsgRevoke, createAuthzAminoConverters } from "./aminomessages";

describe("Authz Amino Converters", () => {
  describe("fromAmino", () => {
    it("work with MsgGrant", () => {
      // Define a sample AminoMsgGrant object
      const msg: AminoMsgGrant = {
        type: "cosmos-sdk/MsgGrant",
        value: {
          granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          grant: {
            authorization: {
              type: "cosmos-sdk/SendAuthorization",
              value: {
                spend_limit: [{ denom: "ustake", amount: "1000000" }],
                allow_list: ["cosmos147auavf4tvghskslq2w65de0nh5dqdmljxc7kh"],
              },
            },
            expiration: new Date("Mon Jan 19 1970 19:25:00 GMT+0800 (Indochina Time)")
              .toISOString()
              .replace(/\.000Z$/, "Z"),
          },
        },
      };

      const msgGrant = new AminoTypes(createAuthzAminoConverters()).fromAmino(msg);
      const expectedValue: MsgGrant = {
        granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
        grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
        grant: {
          authorization: {
            typeUrl: "/cosmos.bank.v1beta1.SendAuthorization",
            value: SendAuthorization.encode({
              spendLimit: [{ denom: "ustake", amount: "1000000" }],
              allowList: ["cosmos147auavf4tvghskslq2w65de0nh5dqdmljxc7kh"],
            }).finish(),
          },
          expiration: {
            seconds: BigInt(1596300),
            nanos: 0,
          },
        },
      };

      expect(msgGrant).toEqual({
        typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
        value: expectedValue,
      });
    });

    it("work with MsgExec", () => {
      // Define a sample AminoMsgExec object
      const msg: AminoMsgExec = {
        type: "cosmos-sdk/MsgExec",
        value: {
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          msgs: [
            {
              typeUrl: "cosmos-sdk/MsgSend",
              value: MsgSend.encode({
                fromAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                toAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                amount: [{ denom: "ustake", amount: "1000000" }],
              }).finish(),
            },
          ],
        },
      };

      const msgExec = new AminoTypes(createAuthzAminoConverters()).fromAmino(msg);
      const expectedValue: MsgExec = {
        grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
        msgs: [
          {
            typeUrl: "cosmos-sdk/MsgSend",
            value: MsgSend.encode({
              fromAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
              toAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
              amount: [{ denom: "ustake", amount: "1000000" }],
            }).finish(),
          },
        ],
      };

      expect(msgExec).toEqual({
        typeUrl: "/cosmos.authz.v1beta1.MsgExec",
        value: expectedValue,
      });
    });

    it("work with MsgRevoke", () => {
      // Define a sample AminoMsgExec object
      const msg: AminoMsgRevoke = {
        type: "cosmos-sdk/MsgRevoke",
        value: {
          granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          msg_type_url: "cosmos-sdk/MsgSend",
        },
      };

      const msgRevoke = new AminoTypes(createAuthzAminoConverters()).fromAmino(msg);
      const expectedValue: MsgRevoke = {
        granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
        grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
        msgTypeUrl: "cosmos-sdk/MsgSend",
      };

      expect(msgRevoke).toEqual({
        typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
        value: expectedValue,
      });
    });
  });

  describe("toAmino", () => {
    describe("fromAmino", () => {
      it("work with MsgGrant", () => {
        // Define a sample MsgGrant object
        const msg: MsgGrant = {
          granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          grant: {
            authorization: {
              typeUrl: "/cosmos.bank.v1beta1.SendAuthorization",
              value: SendAuthorization.encode({
                spendLimit: [{ denom: "ustake", amount: "1000000" }],
                allowList: ["cosmos147auavf4tvghskslq2w65de0nh5dqdmljxc7kh"],
              }).finish(),
            },
            expiration: {
              seconds: BigInt(1596300),
              nanos: 0,
            },
          },
        };

        const aminoMsg = new AminoTypes(createAuthzAminoConverters()).toAmino({
          typeUrl: "/cosmos.authz.v1beta1.MsgGrant",
          value: msg,
        });

        const expectedValues: AminoMsgGrant = {
          type: "cosmos-sdk/MsgGrant",
          value: {
            granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
            grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
            grant: {
              authorization: {
                type: "cosmos-sdk/SendAuthorization",
                value: {
                  spend_limit: [{ denom: "ustake", amount: "1000000" }],
                  allow_list: ["cosmos147auavf4tvghskslq2w65de0nh5dqdmljxc7kh"],
                },
              },
              expiration: new Date("Mon Jan 19 1970 19:25:00 GMT+0800 (Indochina Time)")
                .toISOString()
                .replace(/\.000Z$/, "Z"),
            },
          },
        };

        expect(aminoMsg).toEqual(expectedValues);
      });

      it("work with MsgExec", () => {
        // Define a sample MsgExec object
        const msg: MsgExec = {
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          msgs: [
            {
              typeUrl: "cosmos-sdk/MsgSend",
              value: MsgSend.encode({
                fromAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                toAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                amount: [{ denom: "ustake", amount: "1000000" }],
              }).finish(),
            },
          ],
        };
        const msgExec = new AminoTypes(createAuthzAminoConverters()).toAmino({
          typeUrl: "/cosmos.authz.v1beta1.MsgExec",
          value: msg,
        });

        const expectedValues: AminoMsgExec = {
          type: "cosmos-sdk/MsgExec",
          value: {
            grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
            msgs: [
              {
                typeUrl: "cosmos-sdk/MsgSend",
                value: MsgSend.encode({
                  fromAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                  toAddress: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
                  amount: [{ denom: "ustake", amount: "1000000" }],
                }).finish(),
              },
            ],
          },
        };

        expect(msgExec).toEqual(expectedValues);
      });

      it("work with MsgRevoke", () => {
        // Define a sample AminoMsgExec object
        const msg: MsgRevoke = {
          granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
          grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
          msgTypeUrl: "cosmos-sdk/MsgSend",
        };
        const msgRevoke = new AminoTypes(createAuthzAminoConverters()).toAmino({
          typeUrl: "/cosmos.authz.v1beta1.MsgRevoke",
          value: msg,
        });

        const expectedValues: AminoMsgRevoke = {
          type: "cosmos-sdk/MsgRevoke",
          value: {
            granter: "cosmos1p7v0km9ydt0y9nszlesjy8elzqc4n2v0w4xh2p",
            grantee: "cosmos10dyr9899g6t0pelew4nvf4j5c3jcgv0r73qga5",
            msg_type_url: "cosmos-sdk/MsgSend",
          },
        };

        expect(msgRevoke).toEqual(expectedValues);
      });
    });
  });
});
