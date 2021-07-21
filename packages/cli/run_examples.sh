#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

yarn node ./bin/cosmwasm-cli --init examples/coralnet.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/cosmos_purpose.ts --code "process.exit(0)"
if [ -n "${LAUNCHPAD_ENABLED:-}" ]; then
  yarn node ./bin/cosmwasm-cli --init examples/delegate.ts --code "process.exit(0)"
fi
yarn node ./bin/cosmwasm-cli --init examples/faucet_addresses.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/generate_address.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/helpers.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/local_faucet.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/mask.ts --code "process.exit(0)"
yarn node ./bin/cosmwasm-cli --init examples/multisig_address.ts --code "process.exit(0)"
if [ -n "${SIMAPP_ENABLED:-}" ]; then
  yarn node ./bin/cosmwasm-cli --init examples/stargate.ts --code "process.exit(0)"
fi
