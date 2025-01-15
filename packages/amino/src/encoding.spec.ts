import { Random } from "@cosmjs/crypto";
import { fromBase64, fromBech32, fromHex } from "@cosmjs/encoding";
import { TSError } from "ts-node";

import {
  decodeAminoPubkey,
  decodeBech32Pubkey,
  encodeAminoPubkey,
  encodeBech32Pubkey,
  encodeEd25519Pubkey,
  encodeSecp256k1Pubkey,
} from "./encoding";
import { Pubkey } from "./pubkeys";
import {
  testgroup1,
  testgroup1PubkeyBech32,
  testgroup2,
  testgroup2PubkeyBech32,
  testgroup3,
  testgroup3PubkeyBech32,
  testgroup4,
  testgroup4PubkeyBech32,
} from "./testutils.spec";

describe("encoding", () => {
  describe("encodeSecp256k1Pubkey", () => {
    it("encodes a compressed pubkey", () => {
      const pubkey = fromBase64("AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP");
      expect(encodeSecp256k1Pubkey(pubkey)).toEqual({
        type: "tendermint/PubKeySecp256k1",
        value: "AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP",
      });
    });

    it("throws for uncompressed public keys", () => {
      const pubkey = fromBase64(
        "BE8EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQE7WHpoHoNswYeoFkuYpYSKK4mzFzMV/dB0DVAy4lnNU=",
      );
      expect(() => encodeSecp256k1Pubkey(pubkey)).toThrowError(/public key must be compressed secp256k1/i);
    });
  });

  describe("encodeEd25519Pubkey", () => {
    it("encodes a compressed pubkey", () => {
      const pubkey = fromBase64("ICKLJPyWYIF35GpOclg0gu957WYJe4PHzyn2scCZoek=");
      expect(encodeEd25519Pubkey(pubkey)).toEqual({
        type: "tendermint/PubKeyEd25519",
        value: "ICKLJPyWYIF35GpOclg0gu957WYJe4PHzyn2scCZoek=",
      });
    });

    it("throws for wrong pubkey lengths", () => {
      expect(() => encodeEd25519Pubkey(Random.getBytes(31))).toThrowError(
        /ed25519 public key must be 32 bytes long/i,
      );
      expect(() => encodeEd25519Pubkey(Random.getBytes(64))).toThrowError(
        /ed25519 public key must be 32 bytes long/i,
      );
    });
  });

  describe("decodeAminoPubkey", () => {
    it("works for secp256k1", () => {
      const amino = fromBech32(
        "cosmospub1addwnpepqd8sgxq7aw348ydctp3n5ajufgxp395hksxjzc6565yfp56scupfqhlgyg5",
      ).data;
      expect(decodeAminoPubkey(amino)).toEqual({
        type: "tendermint/PubKeySecp256k1",
        value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
      });
    });

    it("works for ed25519", () => {
      // Encoded from `corald tendermint show-validator`
      // Decoded from http://localhost:26657/validators
      const amino = fromBech32(
        "coralvalconspub1zcjduepqvxg72ccnl9r65fv0wn3amlk4sfzqfe2k36l073kjx2qyaf6sk23qw7j8wq",
      ).data;
      expect(decodeAminoPubkey(amino)).toEqual({
        type: "tendermint/PubKeyEd25519",
        value: "YZHlYxP5R6olj3Tj3f7VgkQE5VaOvv9G0jKATqdQsqI=",
      });
    });

    it("works for sr25519", () => {
      pending("No test data available");
    });

    it("works for multisig", () => {
      const pubkeyData = fromBech32(
        "cosmospub1addwnpepqd8sgxq7aw348ydctp3n5ajufgxp395hksxjzc6565yfp56scupfqhlgyg5",
      ).data;
      const pubkey = {
        type: "tendermint/PubKeySecp256k1",
        value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
      };

      const data1 = fromHex("22C1F7E20805");
      expect(decodeAminoPubkey(data1)).toEqual({
        type: "tendermint/PubKeyMultisigThreshold",
        value: {
          threshold: "5",
          pubkeys: [],
        },
      });

      const data2 = Uint8Array.from([...fromHex("22C1F7E2081a"), 0x12, pubkeyData.length, ...pubkeyData]);
      expect(decodeAminoPubkey(data2)).toEqual({
        type: "tendermint/PubKeyMultisigThreshold",
        value: {
          threshold: "26",
          pubkeys: [pubkey],
        },
      });

      const data3 = Uint8Array.from([
        ...fromHex("22C1F7E2081a"),
        0x12,
        pubkeyData.length,
        ...pubkeyData,
        0x12,
        pubkeyData.length,
        ...pubkeyData,
      ]);
      expect(decodeAminoPubkey(data3)).toEqual({
        type: "tendermint/PubKeyMultisigThreshold",
        value: {
          threshold: "26",
          pubkeys: [pubkey, pubkey],
        },
      });

      expect(() => decodeAminoPubkey(fromHex("22C1F7E20705"))).toThrowError(/expecting 0x08 prefix/i);
    });

    it("throws error for invalid secp256k1 pubkey length", () => {
      const data = new Uint8Array([0, 1, 2, 3, 4]);
      try {
        decodeAminoPubkey(data);
      } catch (error) {
        expect((error as TSError).message).toBe(
          "Unsupported public key type. Amino data starts with: 0001020304",
        );
      }
    });
  });

  describe("decodeBech32Pubkey", () => {
    it("works", () => {
      expect(
        decodeBech32Pubkey("cosmospub1addwnpepqd8sgxq7aw348ydctp3n5ajufgxp395hksxjzc6565yfp56scupfqhlgyg5"),
      ).toEqual({
        type: "tendermint/PubKeySecp256k1",
        value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
      });
    });

    it("works for enigma pubkey", () => {
      expect(
        decodeBech32Pubkey("enigmapub1addwnpepqw5k9p439nw0zpg2aundx4umwx4nw233z5prpjqjv5anl5grmnchzp2xwvv"),
      ).toEqual({
        type: "tendermint/PubKeySecp256k1",
        value: "A6lihrEs3PEFCu8m01ebcas3KjEVAjDIEmU7P9ED3PFx",
      });
    });

    it("works for ed25519", () => {
      // Encoded from `corald tendermint show-validator`
      // Decoded from http://localhost:26657/validators
      const decoded = decodeBech32Pubkey(
        "coralvalconspub1zcjduepqvxg72ccnl9r65fv0wn3amlk4sfzqfe2k36l073kjx2qyaf6sk23qw7j8wq",
      );
      expect(decoded).toEqual({
        type: "tendermint/PubKeyEd25519",
        value: "YZHlYxP5R6olj3Tj3f7VgkQE5VaOvv9G0jKATqdQsqI=",
      });
    });

    it("works for multisig", () => {
      expect(decodeBech32Pubkey(testgroup1PubkeyBech32)).toEqual(testgroup1);
      expect(decodeBech32Pubkey(testgroup2PubkeyBech32)).toEqual(testgroup2);
      expect(decodeBech32Pubkey(testgroup3PubkeyBech32)).toEqual(testgroup3);
    });
  });

  describe("encodeAminoPubkey", () => {
    it("works for secp256k1", () => {
      const pubkey: Pubkey = {
        type: "tendermint/PubKeySecp256k1",
        value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
      };
      const expected = fromBech32(
        "cosmospub1addwnpepqd8sgxq7aw348ydctp3n5ajufgxp395hksxjzc6565yfp56scupfqhlgyg5",
      ).data;
      expect(encodeAminoPubkey(pubkey)).toEqual(expected);
    });

    it("works for ed25519", () => {
      // Decoded from http://localhost:26657/validators
      // Encoded from `corald tendermint show-validator`
      const pubkey: Pubkey = {
        type: "tendermint/PubKeyEd25519",
        value: "YZHlYxP5R6olj3Tj3f7VgkQE5VaOvv9G0jKATqdQsqI=",
      };
      const expected = fromBech32(
        "coralvalconspub1zcjduepqvxg72ccnl9r65fv0wn3amlk4sfzqfe2k36l073kjx2qyaf6sk23qw7j8wq",
      ).data;
      expect(encodeAminoPubkey(pubkey)).toEqual(expected);
    });
  });

  describe("encodeBech32Pubkey", () => {
    it("works for secp256k1", () => {
      const pubkey: Pubkey = {
        type: "tendermint/PubKeySecp256k1",
        value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
      };
      expect(encodeBech32Pubkey(pubkey, "cosmospub")).toEqual(
        "cosmospub1addwnpepqd8sgxq7aw348ydctp3n5ajufgxp395hksxjzc6565yfp56scupfqhlgyg5",
      );
    });

    it("works for ed25519", () => {
      // Decoded from http://localhost:26657/validators
      // Encoded from `corald tendermint show-validator`
      const pubkey: Pubkey = {
        type: "tendermint/PubKeyEd25519",
        value: "YZHlYxP5R6olj3Tj3f7VgkQE5VaOvv9G0jKATqdQsqI=",
      };
      expect(encodeBech32Pubkey(pubkey, "coralvalconspub")).toEqual(
        "coralvalconspub1zcjduepqvxg72ccnl9r65fv0wn3amlk4sfzqfe2k36l073kjx2qyaf6sk23qw7j8wq",
      );
    });

    it("works for multisig", () => {
      const expected1 = fromBech32(testgroup1PubkeyBech32).data;
      expect(encodeAminoPubkey(testgroup1)).toEqual(expected1);

      const expected2 = fromBech32(testgroup2PubkeyBech32).data;
      expect(encodeAminoPubkey(testgroup2)).toEqual(expected2);

      const expected3 = fromBech32(testgroup3PubkeyBech32).data;
      expect(encodeAminoPubkey(testgroup3)).toEqual(expected3);

      const expected4 = fromBech32(testgroup4PubkeyBech32).data;
      expect(encodeAminoPubkey(testgroup4)).toEqual(expected4);
    });
  });
});
