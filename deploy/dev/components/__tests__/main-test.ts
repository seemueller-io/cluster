// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { ClusterComponentsStack } from "../main";

describe("ClusterComponentsStack", () => {
  describe("Resource Creation", () => {
    it("should create all required Helm releases", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      // Check for all Helm releases
      expect(synthesized).toContain("helm_release");
      expect(synthesized).toContain('"name": "cert-manager"');
      expect(synthesized).toContain('"name": "traefik"');
      expect(synthesized).toContain('"name": "db"');
      expect(synthesized).toContain('"name": "my-zitadel"');
    });

    it("should create cert-manager with correct configuration", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"chart": "cert-manager"');
      expect(synthesized).toContain('"version": "v1.18.2"');
      expect(synthesized).toContain('"namespace": "cert-manager"');
      expect(synthesized).toContain('"create_namespace": true');
      expect(synthesized).toContain('"wait": true');
      expect(synthesized).toContain('"name": "crds.enabled"');
      expect(synthesized).toContain('"value": "true"');
    });

    it("should create Traefik with correct configuration", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"chart": "traefik"');
      expect(synthesized).toContain('"version": "36.3.0"');
      expect(synthesized).toContain('"namespace": "ingress"');
      expect(synthesized).toContain("https://traefik.github.io/charts");
      expect(synthesized).toContain("traefik-values.yaml");
    });

    it("should create PostgreSQL with correct configuration", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"chart": "postgresql"');
      expect(synthesized).toContain('"version": "12.10.0"');
      expect(synthesized).toContain("charts.bitnami.com/bitnami");
      expect(synthesized).toContain("postgres-values.yaml");
    });

    it("should create Zitadel with correct configuration", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"chart": "zitadel"');
      expect(synthesized).toContain("charts.zitadel.com");
      expect(synthesized).toContain("zitadel-values.yaml");
    });

    it("should create TLS resources using kubectl apply", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      // Check for null_resource with kubectl apply command containing TLS resources
      expect(synthesized).toContain("null_resource");
      expect(synthesized).toContain("create-tls-resources");
      expect(synthesized).toContain("kubectl apply -f -");
      expect(synthesized).toContain("kind: ClusterIssuer");
      expect(synthesized).toContain("name: selfsigned-issuer");
      
      // Check for Certificate in the kubectl apply command
      expect(synthesized).toContain("kind: Certificate");
      expect(synthesized).toContain("name: zitadel-cert");
      expect(synthesized).toContain("secretName: zitadel-tls");
      expect(synthesized).toContain("machine.127.0.0.1.sslip.io");
    });

    it("should create null resources for operations", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain("null_resource");
      expect(synthesized).toContain("kubectl wait --for=condition=ready certificate");
      expect(synthesized).toContain("kubectl patch ingress");
      expect(synthesized).toContain("kubectl get secret zitadel-tls");
    });
  });

  describe("Resource Dependencies", () => {
    it("should have proper resource dependencies", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      // Verify that resources have dependencies
      expect(synthesized).toContain("depends_on");
    });

    it("should ensure correct deployment order", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      // Traefik should depend on cert-manager
      const traefikSection = synthesized.match(/"traefik"[\s\S]*?"depends_on"[\s\S]*?"helm_release\.cert-manager"/);
      expect(traefikSection).toBeTruthy();
      
      // PostgreSQL should depend on Traefik
      const postgresSection = synthesized.match(/"postgresql"[\s\S]*?"depends_on"[\s\S]*?"helm_release\.traefik"/);
      expect(postgresSection).toBeTruthy();
      
      // Zitadel should depend on PostgreSQL
      const zitadelSection = synthesized.match(/"zitadel"[\s\S]*?"depends_on"[\s\S]*?"helm_release\.postgresql"/);
      expect(zitadelSection).toBeTruthy();
    });
  });

  describe("Providers Configuration", () => {
    it("should configure all required providers", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"provider"');
      expect(synthesized).toContain('"helm"');
      expect(synthesized).toContain('"kubernetes"');
      expect(synthesized).toContain('"null"');
    });

    it("should configure Kubernetes provider with correct context", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"config_path": "~/.kube/config"');
      expect(synthesized).toContain('"config_context": "kind-kind"');
    });
  });

  describe("Outputs", () => {
    it("should create Terraform outputs for important information", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain('"output"');
      expect(synthesized).toContain('"zitadel_url"');
      expect(synthesized).toContain('"admin_credentials"');
      expect(synthesized).toContain("https://machine.127.0.0.1.sslip.io/ui/console");
      expect(synthesized).toContain("zitadel-admin@zitadel.machine.127.0.0.1.sslip.io");
    });
  });

  describe("TLS Configuration", () => {
    it("should create self-signed certificate issuer", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain("apiVersion: cert-manager.io/v1");
      expect(synthesized).toContain("kind: ClusterIssuer");
      expect(synthesized).toContain("selfSigned: {}");
    });

    it("should create certificate with correct DNS names", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      const synthesized = Testing.synth(stack);
      
      expect(synthesized).toContain("commonName: machine.127.0.0.1.sslip.io");
      expect(synthesized).toContain("dnsNames:");
      expect(synthesized).toContain("- machine.127.0.0.1.sslip.io");
      expect(synthesized).toContain("issuerRef:");
      expect(synthesized).toContain("kind: ClusterIssuer");
    });
  });

  describe("Terraform Configuration Validity", () => {
    it("should generate valid Terraform configuration", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      expect(Testing.fullSynth(stack)).toBeValidTerraform();
    });
  });

  describe("Snapshot Tests", () => {
    it("should match the expected Terraform configuration snapshot", () => {
      const app = Testing.app();
      const stack = new ClusterComponentsStack(app, "test-stack");
      expect(Testing.synth(stack)).toMatchSnapshot();
    });
  });
});
