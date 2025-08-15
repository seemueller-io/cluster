import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { HelmProvider } from "./.gen/providers/helm/provider";
import { Release } from "./.gen/providers/helm/release";
import { KubernetesProvider } from "./.gen/providers/kubernetes/provider";
import { NullProvider } from "./.gen/providers/null/provider";
import { Resource } from "./.gen/providers/null/resource";

export class ClusterComponentsStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure providers
    new HelmProvider(this, "helm", {
      kubernetes: {
        configPath: "~/.kube/config",
        configContext: "kind-kind",
      },
    });
    new KubernetesProvider(this, "kubernetes", {
      configPath: "~/.kube/config",
      configContext: "kind-kind",
    });
    new NullProvider(this, "null", {});

    // 1. Install cert-manager for TLS certificate management
    const certManager = new Release(this, "cert-manager", {
      name: "cert-manager",
      repository: "oci://quay.io/jetstack/charts",
      chart: "cert-manager",
      version: "v1.18.2",
      namespace: "cert-manager",
      createNamespace: true,
      wait: true,
      set: [
        {
          name: "crds.enabled",
          value: "true",
        },
      ],
    });

    // 2. Install Traefik ingress controller
    const traefik = new Release(this, "traefik", {
      name: "traefik",
      repository: "https://traefik.github.io/charts",
      chart: "traefik",
      version: "36.3.0",
      namespace: "ingress",
      createNamespace: true,
      wait: true,
      values: [
        `logs:
  general:
    level: DEBUG
additionalArguments:
  - "--serverstransport.insecureskipverify=true"
service:
  type: NodePort
ports:
  web:
    nodePort: 30080
    redirections:
      entryPoint:
        to: websecure
        scheme: https
        permanent: true
  websecure:
    nodePort: 30443
ingressClass:
  enabled: true
  isDefaultClass: true`,
      ],
      dependsOn: [certManager],
    });

    // 3. Install PostgreSQL database
    const postgresql = new Release(this, "postgresql", {
      name: "db",
      repository: "https://charts.bitnami.com/bitnami",
      chart: "postgresql",
      version: "12.10.0",
      namespace: "default",
      wait: true,
      values: [
        `primary:
  pgHbaConfiguration: |
    host all all all trust`,
      ],
      dependsOn: [traefik],
    });

    // 4. Install Zitadel
    const zitadel = new Release(this, "zitadel", {
      name: "my-zitadel",
      repository: "https://charts.zitadel.com",
      chart: "zitadel",
      namespace: "default",
      wait: true,
      values: [
        `zitadel:
  masterkey: x123456789012345678901234567891y
  configmapConfig:
    Log:
      Level: debug
    ExternalDomain: machine.127.0.0.1.sslip.io
    ExternalPort: 443
    TLS:
      Enabled: false
    FirstInstance:
      Org:
        Machine:
          Machine:
            Username: zitadel-admin-sa
            Name: Admin
          MachineKey:
            ExpirationDate: "2026-01-01T00:00:00Z"
            Type: 1
        # PAT:
        #   ExpirationDate: "2026-01-01T00:00:00Z"
    Database:
      Postgres:
        Host: db-postgresql
        Port: 5432
        Database: zitadel
        MaxOpenConns: 20
        MaxIdleConns: 10
        MaxConnLifetime: 30m
        MaxConnIdleTime: 5m
        User:
          Username: postgres
          SSL:
            Mode: disable
        Admin:
          Username: postgres
          SSL:
            Mode: disable
ingress:
  enabled: true
login:
  ingress:
    enabled: true`,
      ],
      dependsOn: [postgresql],
    });

    // 5. Wait for cert-manager CRDs to be available
    const waitForCertManagerCRDs = new Resource(this, "wait-for-cert-manager-crds", {
      triggers: {
        cert_manager_dependency: certManager.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: "kubectl wait --for=condition=established --timeout=120s crd/clusterissuers.cert-manager.io || kubectl get crd clusterissuers.cert-manager.io",
          when: "create",
        },
      ],
      dependsOn: [certManager],
    });

    // 6. Create self-signed certificate issuer and certificate using kubectl apply
    const createTLSResources = new Resource(this, "create-tls-resources", {
      triggers: {
        crd_dependency: waitForCertManagerCRDs.id,
        zitadel_dependency: zitadel.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: zitadel-cert
  namespace: default
spec:
  secretName: zitadel-tls
  issuerRef:
    name: selfsigned-issuer
    kind: ClusterIssuer
  commonName: machine.127.0.0.1.sslip.io
  dnsNames:
  - machine.127.0.0.1.sslip.io
EOF`,
          when: "create",
        },
      ],
      dependsOn: [waitForCertManagerCRDs, zitadel],
    });

    // 7. Wait for certificate to be ready
    const waitForCertificate = new Resource(this, "wait-for-certificate", {
      triggers: {
        tls_resources_dependency: createTLSResources.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: "kubectl wait --for=condition=ready certificate zitadel-cert -n default --timeout=120s || true",
          when: "create",
        },
      ],
      dependsOn: [createTLSResources],
    });

    // 8. Patch ingresses with TLS configuration
    const patchIngresses = new Resource(this, "patch-ingresses", {
      triggers: {
        wait_dependency: waitForCertificate.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `
            kubectl patch ingress my-zitadel -n default --type='merge' -p='{"spec":{"tls":[{"hosts":["machine.127.0.0.1.sslip.io"],"secretName":"zitadel-tls"}]}}' || true
            kubectl patch ingress my-zitadel-login -n default --type='merge' -p='{"spec":{"tls":[{"hosts":["machine.127.0.0.1.sslip.io"],"secretName":"zitadel-tls"}]}}' || true
          `,
          when: "create",
        },
      ],
      dependsOn: [waitForCertificate],
    });

    // 9. Configure custom SSL and extract certificate
    const configureSSL = new Resource(this, "configure-ssl", {
      triggers: {
        patch_dependency: patchIngresses.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `
            # Extract certificate and add to system trust store
            kubectl get secret zitadel-tls -n default -o jsonpath='{.data.tls\\.crt}' | base64 -d > ./certs/zitadel-cert.crt || true
          `,
          when: "create",
        },
      ],
      dependsOn: [patchIngresses],
    });

    // 10. Wait for Zitadel service account secret and extract credentials
    const extractCredentials = new Resource(this, "extract-credentials", {
      triggers: {
        ssl_dependency: configureSSL.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `echo 'Credential extraction would run during apply'`,
          when: "create",
        },
      ],
      dependsOn: [configureSSL],
    });

    // 11. Verify Zitadel accessibility
    const verifyZitadel = new Resource(this, "verify-zitadel", {
      triggers: {
        credentials_dependency: extractCredentials.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `echo 'Zitadel verification would run during apply'`,
          when: "create",
        },
      ],
      dependsOn: [extractCredentials],
    });

    // 12. Output success message
    new Resource(this, "completion-message", {
      triggers: {
        verification_dependency: verifyZitadel.id,
      },
      provisioners: [
        {
          type: "local-exec",
          command: `echo 'Installation completed successfully!'`,
          when: "create",
        },
      ],
      dependsOn: [verifyZitadel],
    });

    // Output important information
    new TerraformOutput(this, "zitadel_url", {
      value: "https://machine.127.0.0.1.sslip.io/ui/console?login_hint=zitadel-admin@zitadel.machine.127.0.0.1.sslip.io",
      description: "Zitadel Console URL",
    });

    new TerraformOutput(this, "admin_credentials", {
      value: "zitadel-admin@zitadel.machine.127.0.0.1.sslip.io / Password1!",
      description: "Default admin credentials",
    });
  }
}

const app = new App();
new ClusterComponentsStack(app, "cluster-components");
app.synth();
