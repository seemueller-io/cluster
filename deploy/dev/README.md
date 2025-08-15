- `/cluster` - Terraform CDK TypeScript configurations
    - `main.ts` - Deploys the Kubernetes cluster
- `/components` - Terraform CDK TypeScript configurations
    - `main.ts` - Deploys runtime components to the cluster (CertManager, ZITADEL, Postgres, ect...)
- `/configurations` - Terraform CDK TypeScript configurations
    - `main.ts` - Main Terraform configuration file for ZITADEL setup including organization, project, OIDC application,
      and a development user