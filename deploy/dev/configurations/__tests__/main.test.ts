// Copyright (c) HashiCorp, Inc
// SPDX-License-Identifier: MPL-2.0
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { ZitadelStack } from "../main";
import { Org } from "../.gen/providers/zitadel/org";
import { Project } from "../.gen/providers/zitadel/project";
import { ApplicationOidc } from "../.gen/providers/zitadel/application-oidc";
import { HumanUser } from "../.gen/providers/zitadel/human-user";

describe("Zitadel Configurator", () => {
  describe("Unit testing using assertions", () => {
    it("should create an organization resource", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Test that the stack contains an Org resource
      expect(Testing.synth(stack)).toHaveResource(Org);
    });

    it("should create organization with name 'makers'", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Verify the organization was created and stored
      expect(stack.createdOrg).toBeDefined();
      
      // Test the synthesized terraform to ensure it contains the expected resource properties
      expect(Testing.synth(stack)).toHaveResourceWithProperties(Org, {
        name: "makers"
      });
    });

    it("should create a project for the organization", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Test that the stack contains a Project resource
      expect(Testing.synth(stack)).toHaveResource(Project);
      
      // Verify the project was created and stored
      expect(stack.createdProject).toBeDefined();
      
      // Test the synthesized terraform to ensure it contains the expected resource properties
      expect(Testing.synth(stack)).toHaveResourceWithProperties(Project, {
        name: "makers-project"
      });
    });

    it("should create an OIDC application for the project", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Test that the stack contains an ApplicationOidc resource
      expect(Testing.synth(stack)).toHaveResource(ApplicationOidc);
      
      // Verify the application was created and stored
      expect(stack.createdApp).toBeDefined();
      
      // Test the synthesized terraform to ensure it contains the expected resource properties
      expect(Testing.synth(stack)).toHaveResourceWithProperties(ApplicationOidc, {
        name: "makers-app"
      });
    });

    it("should expose clientId and clientSecret from the created app", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Verify that the created app has clientId and clientSecret properties available
      expect(stack.createdApp).toBeDefined();
      expect(stack.createdApp.clientId).toBeDefined();
      expect(stack.createdApp.clientSecret).toBeDefined();
    });

    it("should create a user in the organization", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Test that the stack contains a HumanUser resource
      expect(Testing.synth(stack)).toHaveResource(HumanUser);
      
      // Verify the user was created and stored
      expect(stack.createdUser).toBeDefined();
      
      // Test the synthesized terraform to ensure it contains the expected resource properties
      expect(Testing.synth(stack)).toHaveResourceWithProperties(HumanUser, {
        user_name: "makers-user"
      });
    });

    it("should expose user credentials from the created user", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Verify that the created user has credential properties available
      expect(stack.createdUser).toBeDefined();
      expect(stack.createdUser.loginNames).toBeDefined();
      expect(stack.createdUser.preferredLoginName).toBeDefined();
      expect(stack.createdUser.state).toBeDefined();
    });

    it("should create OIDC application with correct organization context", () => {
      const app = Testing.app();
      const stack = new ZitadelStack(app, "test-stack");
      
      // Test the synthesized terraform to ensure the OIDC application has orgId properly set
      // This ensures the application can find the project within the correct organization
      expect(Testing.synth(stack)).toHaveResourceWithProperties(ApplicationOidc, {
        name: "makers-app",
        org_id: "${zitadel_org.org.id}"
      });
    });
  });

  // // All Unit tests test the synthesised terraform code, it does not create real-world resources
  // describe("Unit testing using assertions", () => {
  //   it("should contain a resource", () => {
  //     // import { Image,Container } from "./.gen/providers/docker"
  //     expect(
  //       Testing.synthScope((scope) => {
  //         new MyApplicationsAbstraction(scope, "my-app", {});
  //       })
  //     ).toHaveResource(Container);

  //     expect(
  //       Testing.synthScope((scope) => {
  //         new MyApplicationsAbstraction(scope, "my-app", {});
  //       })
  //     ).toHaveResourceWithProperties(Image, { name: "ubuntu:latest" });
  //   });
  // });

  // describe("Unit testing using snapshots", () => {
  //   it("Tests the snapshot", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestProvider(stack, "provider", {
  //       accessKey: "1",
  //     });

  //     new TestResource(stack, "test", {
  //       name: "my-resource",
  //     });

  //     expect(Testing.synth(stack)).toMatchSnapshot();
  //   });

  //   it("Tests a combination of resources", () => {
  //     expect(
  //       Testing.synthScope((stack) => {
  //         new TestDataSource(stack, "test-data-source", {
  //           name: "foo",
  //         });

  //         new TestResource(stack, "test-resource", {
  //           name: "bar",
  //         });
  //       })
  //     ).toMatchInlineSnapshot();
  //   });
  // });

  // describe("Checking validity", () => {
  //   it("check if the produced terraform configuration is valid", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestDataSource(stack, "test-data-source", {
  //       name: "foo",
  //     });

  //     new TestResource(stack, "test-resource", {
  //       name: "bar",
  //     });
  //     expect(Testing.fullSynth(app)).toBeValidTerraform();
  //   });

  //   it("check if this can be planned", () => {
  //     const app = Testing.app();
  //     const stack = new TerraformStack(app, "test");

  //     new TestDataSource(stack, "test-data-source", {
  //       name: "foo",
  //     });

  //     new TestResource(stack, "test-resource", {
  //       name: "bar",
  //     });
  //     expect(Testing.fullSynth(app)).toPlanSuccessfully();
  //   });
  // });
});
