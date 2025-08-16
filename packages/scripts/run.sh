#!/usr/bin/env sh

(cd deploy/dev/cluster && bun run deploy)
(cd deploy/dev/components && bun run deploy)
(cd deploy/dev/configurations && bun run deploy)