#!/usr/bin/env sh

set -e

(cargo check &)

bun i

for dir in deploy/dev/*/; do
    if [ -f "${dir}/cdktf.json" ]; then
        echo "Running cdktf get in ${dir}"
        cd "${dir}" && cdktf get && cd - > /dev/null
    fi
done

wait