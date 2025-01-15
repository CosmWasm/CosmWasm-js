import { FaucetClient } from "./faucetclient";

function pendingWithoutFaucet(): void {
  if (!process.env.FAUCET_ENABLED) {
    pending("Set FAUCET_ENABLED to enable tests that need a faucet");
  }
}

describe("FaucetClient", () => {
  const faucetUrl = "http://localhost:8000";
  const primaryToken = "ucosm";
  const secondaryToken = "ustake";
  const defaultAddress = "wasm14qemq0vw6y3gc3u3e0aty2e764u4gs5lndxgyk";

  it("can be constructed", () => {
    // http
    expect(new FaucetClient("http://localhost:8000")).toBeTruthy();
    expect(new FaucetClient("http://localhost:8000/")).toBeTruthy();
    expect(new FaucetClient("http://localhost")).toBeTruthy();
    expect(new FaucetClient("http://localhost/")).toBeTruthy();
    // https
    expect(new FaucetClient("https://localhost:8000")).toBeTruthy();
    expect(new FaucetClient("https://localhost:8000/")).toBeTruthy();
    expect(new FaucetClient("https://localhost")).toBeTruthy();
    expect(new FaucetClient("https://localhost/")).toBeTruthy();
  });

  it("should throw error if the base URL does not start with http:// or https://", () => {
    expect(() => new FaucetClient("ftp://example.com")).toThrowError(
      "Expected base url to start with http:// or https://",
    );
  });

  it("can be used to credit a wallet", async () => {
    pendingWithoutFaucet();
    const faucet = new FaucetClient(faucetUrl);
    await faucet.credit(defaultAddress, primaryToken);
  });

  it("can be used to credit a wallet with a different token", async () => {
    pendingWithoutFaucet();
    const faucet = new FaucetClient(faucetUrl);
    await faucet.credit(defaultAddress, secondaryToken);
  });

  it("throws for invalid ticker", async () => {
    pendingWithoutFaucet();
    const faucet = new FaucetClient(faucetUrl);
    await faucet.credit(defaultAddress, "ETH").then(
      () => fail("must not resolve"),
      (error) => expect(error).toMatch(/token is not available/i),
    );
  });

  it("throws for invalid address", async () => {
    pendingWithoutFaucet();
    const faucet = new FaucetClient(faucetUrl);

    for (const address of ["be5cc2cc05db2cdb4313c18306a5157291cfdcd1", "1234L"]) {
      await faucet.credit(address, primaryToken).then(
        () => fail("must not resolve"),
        (error) => expect(error).toMatch(/address is not in the expected format for this chain/i),
      );
    }
  });
});
