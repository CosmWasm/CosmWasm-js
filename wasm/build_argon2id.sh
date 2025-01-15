#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

gnused="$(command -v gsed || echo sed)"

(
  cd argon2id
  wasm-pack build --target nodejs

  # Prettify before inlining the big Wasm blob to keep this fast and bytes list compact
  yarn prettier --write 'pkg/*.{js,ts}'

  echo "Wasm blob built:"
  ls -l pkg/argon2id_bg.wasm

  BYTES=$(python3 <<HEREDOC
with open("pkg/argon2id_bg.wasm", "rb") as f:
    bytes = [str(byte[0]) for byte in iter(lambda: f.read(1), b'')]
    print("const bytes = new Uint8Array([" + ",".join(bytes) + "]);")
HEREDOC
)
  "$gnused" -i \
    -e "s/^const { TextDecoder, TextEncoder } =.*$//" \
    -e "s/^const path =.*$//" \
    -e "s/^const bytes =.*$/$BYTES/" \
    pkg/argon2id.js
  mkdir -p pkg2
  cp pkg/argon2id.js pkg2/index.js
  cp pkg/argon2id.d.ts pkg2/index.d.ts
  echo '{ "main": "index.js", "types": "index.d.ts" }' | jq > pkg2/package.json
  cp -R pkg2 ../../packages/crypto/src/
)
