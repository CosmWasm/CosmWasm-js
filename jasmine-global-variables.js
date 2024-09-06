const process = {
  ...process,
  env: {
    ...process.env,
    HTTPSERVER_ENABLED: 1,
    SIMAPP44_ENABLED: 1,
    SLOW_SIMAPP44_ENABLED: 1,
    TENDERMINT_ENABLED: 1,
    SOCKETSERVER_ENABLED: 1,
    SKIP_BUILD: 1,
    WASMD_ENABLED: 1
  }
};