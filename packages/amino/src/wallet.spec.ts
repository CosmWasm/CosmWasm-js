import { fromHex } from "@cosmjs/encoding";

import { decrypt, encrypt, executeKdf, KdfConfiguration } from "./wallet";

describe("wallet", () => {
  describe("executeKdf", () => {
    describe("with supported algorithm", () => {
      it("can execute", async () => {
        const password = "123";
        const kdfConfiguration: KdfConfiguration = {
          algorithm: "argon2id",
          params: {
            outputLength: 32,
            opsLimit: 4,
            memLimitKib: 3 * 1024,
          },
        };
        await expectAsync(executeKdf(password, kdfConfiguration)).not.toBeRejected();
      });

      describe("with invalid params", () => {
        it("throws", async () => {
          const password = "123";
          const kdfConfiguration: KdfConfiguration = {
            algorithm: "argon2id",
            params: {
              outputLength: "invalid",
              opsLimit: "invalid",
              memLimitKib: "invalid",
            },
          };
          await expectAsync(executeKdf(password, kdfConfiguration)).toBeRejectedWith(
            new Error("Invalid format of argon2id params"),
          );
        });
      });
    });

    describe("with unsupported algorithm", () => {
      it("throws", async () => {
        const password = "123";
        const kdfConfiguration: KdfConfiguration = {
          algorithm: "unsupported",
          params: {},
        };
        await expectAsync(executeKdf(password, kdfConfiguration)).toBeRejectedWith(
          new Error("Unsupported KDF algorithm"),
        );
      });
    });
  });

  describe("encrypt", () => {
    describe("with supported algorithm", () => {
      it("can encrypt without throw", async () => {
        const plaintext = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
        const encryptionKey = fromHex("1324cdddc4b94e625bbabcac862c9429ba011e2184a1ccad60e7c3f6ff4916d8");
        const encryptionConfiguration = {
          algorithm: "xchacha20poly1305-ietf",
          params: {},
        };
        await expectAsync(encrypt(plaintext, encryptionKey, encryptionConfiguration)).not.toBeRejected();
      });
    });

    describe("with unsupported algorithm", () => {
      it("throws", async () => {
        const plaintext = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
        const encryptionKey = fromHex("1324cdddc4b94e625bbabcac862c9429ba011e2184a1ccad60e7c3f6ff4916d8");
        const encryptionConfiguration = {
          algorithm: "unsupported",
          params: {},
        };
        await expectAsync(encrypt(plaintext, encryptionKey, encryptionConfiguration)).toBeRejectedWith(
          new Error("Unsupported encryption algorithm: 'unsupported'"),
        );
      });
    });
  });

  describe("decrypt", () => {
    const plaintext = new Uint8Array([0x11, 0x22, 0x33, 0x44]);
    const encryptionKey = fromHex("1324cdddc4b94e625bbabcac862c9429ba011e2184a1ccad60e7c3f6ff4916d8");
    const encryptionConfiguration = {
      algorithm: "xchacha20poly1305-ietf",
      params: {},
    };

    describe("with supported algorithm", () => {
      it("can decrypt without throw", async () => {
        const ciphertext = await encrypt(plaintext, encryptionKey, encryptionConfiguration);
        await decrypt(ciphertext, encryptionKey, encryptionConfiguration);
        await expectAsync(decrypt(ciphertext, encryptionKey, encryptionConfiguration)).not.toBeRejected();
      });
    });

    describe("with unsupported algorithm", () => {
      it("throws", async () => {
        const ciphertext = await encrypt(plaintext, encryptionKey, encryptionConfiguration);
        await expectAsync(
          decrypt(ciphertext, encryptionKey, {
            algorithm: "unsupported",
            params: {},
          }),
        ).toBeRejectedWith(new Error("Unsupported encryption algorithm: 'unsupported'"));
      });
    });
  });
});
