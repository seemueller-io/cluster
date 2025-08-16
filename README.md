# seemueller-io/cluster

### k8s _"as simple as possible, but no simpler."_

```shell
<npm|yarn|pnpm|bun> run clean
<npm|yarn|pnpm|bun> run setup
<npm|yarn|pnpm|bun> run dev
```

## Directory Structure
```markdown
deploy/
├── [env]: Environment Deployment
│ ├── cluster - Manages deployment of a cluster
│ ├── components - Manages deployments of services on the cluster (ZITADEL, CertManager, ect...)
│ └── configurations - Manages provider specific configurations
packages/
└── Scripts, Example Apps, and a development proxy
```


## Architecture

```mermaid
flowchart LR

%% ===== Local Machine =====
subgraph L[Local Machine]
direction TB
  user[Developer Browser]
  proxy[dev-proxy HTTP]
  host[Port Mapping Layer]
  registry[Local Docker Registry]

  user -->|HTTP 3000| proxy
  proxy -->|HTTPS 443| host
end

%% ===== Kind Cluster =====
subgraph K[Kind Cluster]
direction TB
  ingress[Ingress Controller]
  exampleApp[Example Web App]
  apps[Backend Services]
  zitadel[ZITADEL IAM]
  pg[(PostgreSQL Identity Store)]
  cert[Cert-Manager]

  %% Routing
  ingress --> exampleApp
  ingress --> apps

  %% OIDC
  exampleApp -->|OIDC: /authorize, /callback| zitadel
  apps -->|Validate OIDC tokens| zitadel
  zitadel --> pg

  %% TLS automation (dotted)
  cert -.-> ingress
  cert -.-> exampleApp
  cert -.-> apps
  cert -.-> zitadel
end

%% ===== Local ⇄ Cluster =====
host -->|80 -> 30080, 443 -> 30443| ingress

%% ===== Images into the cluster =====
registry -->|image pulls| exampleApp
registry -->|image pulls| apps

%% ===== CDKTF Stacks =====
subgraph T[CDKTF Stacks]
direction TB
  clusterStack[cluster]
  componentsStack[components]
  configurationsStack[configurations]
end

clusterStack --> ingress
componentsStack --> ingress
componentsStack --> cert
componentsStack --> zitadel
configurationsStack --> exampleApp
configurationsStack --> apps

```

The dev-proxy accepts HTTP on port 3000 and forwards HTTPS to the ingress controller inside the Kind cluster. Traffic is routed through ingress to services secured by ZITADEL and PostgreSQL, with Cert-Manager handling TLS. CDKTF provisions the cluster, core components, and app configs.

## Developer Notes
For platforms other than Darwin, you'll need to trust root certificates manually.
