# Confio hosts a faucet build at https://hub.docker.com/r/confio/faucet
#
# Build:
#   docker build --pull -t confio/faucet:manual -f packages/faucet/Dockerfile .
# Run:
#   docker run --rm confio/faucet:manual version
#
# During the build step the working directory must be the repo root such that the
# app has access to all installed dependencies.

FROM node:14-alpine as build-env

ADD . /app
WORKDIR /app

RUN apk add --update --no-cache alpine-sdk linux-headers build-base gcc libusb-dev python3 py3-pip eudev-dev
RUN ln -sf python3 /usr/bin/python

ENV YARN_CHECKSUM_BEHAVIOR=reset
RUN yarn install && yarn run build
RUN (cd packages/faucet && SKIP_BUILD=1 yarn pack-node)

# Use Alpine and install Node.js which is 50% smaller than the -alpine version of the node
# image (53 MB including the faucet app).
FROM alpine:3.15
# Installs Node.js 16 (https://pkgs.alpinelinux.org/packages?name=nodejs&branch=v3.15)
RUN apk add --update nodejs

COPY --from=build-env /app/packages/faucet /app/packages/faucet
WORKDIR /app

EXPOSE 8000
ENTRYPOINT ["/app/packages/faucet/bin/cosmos-faucet-dist"]
