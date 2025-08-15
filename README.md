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

%% =========================
%% External -> Local Host
%% =========================
    user[Developer Browser]
    proxy[localhost-proxy HTTPS to HTTP]
    host[localhost Port Mapping Layer]

    user -->|HTTPS 443| proxy
    proxy -->|HTTP 80| host
    host -->|80 -> 30080, 443 -> 30443| ingress

%% =========================
%% Kind Cluster
%% =========================
    subgraph clusterSG[Kind Cluster - Local Kubernetes]
        direction TB

        ingress[Ingress Controller - Kubernetes Entry Point]
        exampleApp[Example Web App - Frontend UI]
        apps[Example Backend Services - Microservices API]
        zitadel[ZITADEL IAM - OIDC Provider]
        pg[PostgreSQL Identity Store]
        cert[Cert-Manager - Automated TLS]

    %% Ingress routing
        ingress --> exampleApp
        ingress --> apps

    %% ZITADEL fronting the app
        exampleApp -->|OIDC: /authorize, /callback| zitadel
        apps -->|Validate OIDC tokens| zitadel
        zitadel --> pg

    %% Cert relationships (dotted to indicate control/automation)
        cert -.-> ingress
        cert -.-> exampleApp
        cert -.-> apps
        cert -.-> zitadel
    end

%% =========================
%% Local Registry
%% =========================
    registry[Local Docker Registry localhost:5001]
    registry --> clusterSG

%% =========================
%% CDKTF Stacks
%% =========================
    subgraph cdk[CDKTF Stacks]
        direction TB
        clusterStack[cluster - Provisions K8s]
        componentsStack[components - Ingress, Cert-Manager, ZITADEL]
        configurationsStack[configurations - App Deployments and Config]
    end

    cdk -->|deploys| clusterSG
```

Local HTTPS traffic is proxied to the Kind cluster via port mappings, routed through ingress to services secured by ZITADEL and PostgreSQL, with Cert-Manager handling TLS. CDKTF provisions the cluster, core components, and app configs, using a local Docker registry for images.

## Developer Notes
For platforms other than Darwin, you'll need to trust root certificates manually.
