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
%%{init: {
  'theme': 'default',
  'flowchart': { 'rankSpacing': 60, 'nodeSpacing': 60, 'diagramPadding': 48, 'htmlLabels': true },
  'themeVariables': { 'fontSize': '18px', 'fontFamily': 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif' }
}}%%
flowchart TB

%% =========================
%% Local Machine (Entry Path)
%% =========================
subgraph local[Local Machine]
direction TB
user[Developer Browser]
proxy[localhost-proxy<br/>HTTP → HTTPS]
host[localhost Port<br/>Mapping Layer]
registry[Local Docker Registry<br/>localhost:5001]
user -->|HTTP :3000| proxy
proxy -->|HTTPS :443| host
end

%% =========================
%% Kind Cluster (Platform)
%% =========================
subgraph clusterSG[Kind Cluster — Local Kubernetes]
direction TB

%% Edge / Entry
ingress[Ingress Controller<br/>Kubernetes Entry Point]

%% Workloads behind ingress
subgraph workloads[Workloads]
direction LR
exampleApp[Example Web App<br/>Frontend UI]
apps[Backend Services<br/>Microservices API]
end

%% Identity & Data
subgraph iam[Identity & Access]
direction TB
zitadel[ZITADEL IAM<br/>OIDC Provider]
pg[(PostgreSQL<br/>Identity Store)]
zitadel --> pg
end

%% Cluster automation
cert[Cert-Manager<br/>Automated TLS]

%% Ingress routing to services
ingress --> exampleApp
ingress --> apps

%% OIDC flows
exampleApp -->|OIDC: /authorize, /callback| zitadel
apps -->|Validate OIDC tokens| zitadel

%% Cert-manager relationships (dotted = automation/control)
cert -.-> ingress
cert -.-> exampleApp
cert -.-> apps
cert -.-> zitadel
end

%% =========================
%% Image pulls into the cluster
%% =========================
registry -->|image pulls| exampleApp
registry -->|image pulls| apps

%% =========================
%% Local → Cluster networking
%% =========================
host -->|80 → 30080<br/>443 → 30443| ingress

%% =========================
%% CDKTF Stacks (Provision & Configure)
%% =========================
subgraph cdk[CDKTF Stacks]
direction TB
clusterStack[cluster — Provisions K8s]
componentsStack[components — Ingress, Cert-Manager, ZITADEL]
configurationsStack[configurations — App Deployments & Config]
end

%% Show where each stack applies
clusterStack --> ingress
componentsStack --> ingress
componentsStack --> cert
componentsStack --> zitadel
configurationsStack --> exampleApp
configurationsStack --> apps

%% =========================
%% Visual styling
%% =========================
classDef external fill:#E8F1FF,stroke:#3B82F6,color:#111,stroke-width:1px;
classDef service  fill:#F8FAFC,stroke:#64748B,color:#111,stroke-width:1px;
classDef identity fill:#FFF7E6,stroke:#F59E0B,color:#111,stroke-width:1px;
classDef data     fill:#FDEDED,stroke:#EF4444,color:#111,stroke-width:1px;
classDef ops      fill:#ECFDF5,stroke:#10B981,color:#111,stroke-width:1px;
classDef infra    fill:#EEF2FF,stroke:#6366F1,color:#111,stroke-width:1px;

class user,proxy,host,registry external
class ingress,workloads infra
class exampleApp,apps service
class zitadel identity
class pg data
class cert ops
class clusterStack,componentsStack,configurationsStack infra

```

Access the dev UI at http://localhost:3000. The localhost-proxy accepts HTTP on port 3000 and forwards HTTPS to localhost:443; the Kind cluster maps host ports 80 -> 30080 and 443 -> 30443 to the ingress controller inside the cluster. Traffic is routed through ingress to services secured by ZITADEL and PostgreSQL, with Cert-Manager handling TLS. CDKTF provisions the cluster, core components, and app configs, using a local Docker registry for images.

## Developer Notes
For platforms other than Darwin, you'll need to trust root certificates manually.
