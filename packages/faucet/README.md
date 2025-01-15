# @cosmjs/faucet

[![npm version](https://img.shields.io/npm/v/@cosmjs/faucet.svg)](https://www.npmjs.com/package/@cosmjs/faucet)

The faucet is built as part of the monorepo. In the repo root do:

```
yarn install
yarn build
```

Then start it for a Wasmd development blockchain using:

```
cd packages/faucet
yarn dev-start
```

Advanced users that want to provide their custom config can start as follows:

```
FAUCET_CREDIT_AMOUNT_UCOSM=10000000 \
  FAUCET_CREDIT_AMOUNT_USTAKE=5000000 \
  FAUCET_CONCURRENCY=3 \
  FAUCET_MNEMONIC="economy stock theory fatal elder harbor betray wasp final emotion task crumble siren bottom lizard educate guess current outdoor pair theory focus wife stone" \
  ./bin/cosmos-faucet start "http://localhost:1317"
```

## Usage

```
Usage: cosmos-faucet action [arguments...]

Positional arguments per action are listed below. Arguments in parentheses are optional.

help      Shows a help text and exits

version   Prints the version and exits

generate  Generates a random mnemonic, shows derived faucet addresses and exits

start     Starts the faucet
           1  Node base URL, e.g. http://localhost:1317

Environment variables

FAUCET_CONCURRENCY        Number of distributor accounts. Defaults to 5.
FAUCET_PORT               Port of the webserver. Defaults to 8000.
FAUCET_MEMO               Memo for send transactions. Defaults to unset.
FAUCET_GAS_PRICE          Gas price for transactions as a comma separated list.
                          Defaults to "0.025ucosm".
FAUCET_GAS_LIMIT          Gas limit for send transactions. Defaults to 100000.
FAUCET_MNEMONIC           Secret mnemonic that serves as the base secret for the
                          faucet HD accounts
FAUCET_PATH_PATTERN       The pattern of BIP32 paths for the faucet accounts.
                          Must contain one "a" placeholder that is replaced with
                          the account index.
                          Defaults to the Cosmos Hub path "m/44'/118'/0'/0/a".
FAUCET_ADDRESS_PREFIX     The bech32 address prefix. Defaults to "cosmos".
FAUCET_TOKENS             A comma separated list of token denoms, e.g.
                          "uatom" or "ucosm, mstake".
FAUCET_CREDIT_AMOUNT_TKN  Send this amount of TKN to a user requesting TKN. TKN is
                          a placeholder for the token's denom. Defaults to 10000000.
FAUCET_REFILL_FACTOR      Send factor times credit amount on refilling. Defaults to 8.
FAUCET_REFILL_THRESHOLD   Refill when balance gets below factor times credit amount.
                          Defaults to 20.
FAUCET_COOLDOWN_TIME      Time (in seconds) after which an address can request
                          more tokens. Can be set to "0". Defaults to 24 hours
                          if unset or an empty string.
```

### Faucet HD wallet

The faucet uses standard HD paths for each blockchain, e.g.

```
IOV        m/44'/234'/a'
Lisk       m/44'/134'/a'
Cosmos     m/44'/118'/0'/0/a
```

where `a` is a 0-based index of the account. Account 0 is the token holder and
account 1...FAUCET_CONCURRENCY are the distributor accounts.

This means the token holder account can be accessed using the Neuma wallet when
the same mnemonic is used. Accessing the distributor accounts will be possible
as soon as there is
[multi account support](https://github.com/iov-one/ponferrada/milestone/3).

### Working with docker

**Note:** The Dockerfile in this repo is for demonstration purposes only. If you
chose to deploy the faucet via docker, make sure to copy the Dockerfile and keep
it up-to-date.

- Build an artifact (from monorepo root)

```sh
cd docs
docker build -t local-cosmos-faucet:manual --file faucet.Dockerfile .
```

- Version and help

```sh
docker run --read-only --rm local-cosmos-faucet:manual version
docker run --read-only --rm local-cosmos-faucet:manual help
```

- Run faucet locally

```sh
DOCKER_HOST_IP=$(docker run --read-only --rm alpine ip route | awk 'NR==1 {print $3}'); \
  FAUCET_CONCURRENCY=3 FAUCET_MNEMONIC="economy stock theory fatal elder harbor betray wasp final emotion task crumble siren bottom lizard educate guess current outdoor pair theory focus wife stone" \
  docker run --read-only --rm \
  -e FAUCET_MNEMONIC \
  -e FAUCET_CONCURRENCY \
  -p 8000:8000 \
  local-cosmos-faucet:manual \
  start "http://$DOCKER_HOST_IP:1317"
```

### Using the faucet

Now that the faucet has been started up, you can send credit requests to it.
This can be done with a simple http POST request. These commands assume the
faucet is running locally, be sure to change it from `localhost` if your
situation is different.

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"denom":"ucosm","address":"cosmos1yre6ac7qfgyfgvh58ph0rgw627rhw766y430qq"}' \
  http://localhost:8000/credit
```

### Checking the faucets status

The faucet provides a simple status check in the form of an http GET request. As
above, make sure to adjust the URL as necessary.

```
curl http://localhost:8000/status
```

## License

This package is part of the cosmjs repository, licensed under the Apache License
2.0 (see [NOTICE](https://github.com/cosmos/cosmjs/blob/main/NOTICE) and
[LICENSE](https://github.com/cosmos/cosmjs/blob/main/LICENSE)).
