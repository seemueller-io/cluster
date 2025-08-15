#!/usr/bin/env sh

echo "WARNING: This will destroy all local deployments."
echo -n "Are you sure you want to proceed? (y/N): "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Teardown cancelled."
    exit 0
fi

(cd deploy/dev/cluster && bun run destroy)
(cd deploy/dev/components && bun run destroy)
(cd deploy/dev/configurations && bun run destroy)