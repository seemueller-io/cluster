import {Construct} from "constructs";
import {App, TerraformOutput, TerraformStack} from "cdktf";

import {Org} from "./.gen/providers/zitadel/org";
import {Project} from "./.gen/providers/zitadel/project";
import {ApplicationOidc} from "./.gen/providers/zitadel/application-oidc";
import {HumanUser} from "./.gen/providers/zitadel/human-user";
import {ZitadelProvider} from "./.gen/providers/zitadel/provider";

import * as path from "node:path";
import {readFileSync} from "fs";

export class ZitadelStack extends TerraformStack {
    public readonly createdOrg: Org;
    public readonly createdProject: Project;
    public readonly createdApp: ApplicationOidc;
    public readonly createdUser: HumanUser;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const provider = new ZitadelProvider(this, "zitadel", {
            domain: "machine.127.0.0.1.sslip.io",   // your instance URL
            jwtProfileJson: JSON.stringify(JSON.parse(readFileSync(path.resolve("zitadel-admin-sa.json").toString(), 'utf-8'))),
        });


        this.createdOrg = new Org(this, "org", {
            name: "makers",
            provider: provider,
        });

        this.createdProject = new Project(this, "project", {
            name: "makers-project",
            orgId: this.createdOrg.id,
            provider: provider,
        });

        this.createdApp = new ApplicationOidc(this, "app", {
            name: "makers-app",
            projectId: this.createdProject.id,
            orgId: this.createdOrg.id,
            grantTypes: ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
            redirectUris: ["http://localhost:3000/callback"],
            responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
            provider: provider,
            dependsOn: [this.createdProject],
        });

        this.createdUser = new HumanUser(this, "user", {
            userName: "makers-user",
            email: "makers-user@example.com",
            firstName: "Makers",
            lastName: "User",
            displayName: "Makers User",
            orgId: this.createdOrg.id,
            initialPassword: "TempPassword123!",
            isEmailVerified: true,
            provider: provider,
        });

        new TerraformOutput(this, "client_id", {
            value: this.createdApp.clientId,
            description: "The client ID of the OIDC application",
            sensitive: true,
        });

        new TerraformOutput(this, "client_secret", {
            value: this.createdApp.clientSecret,
            description: "The client secret of the OIDC application",
            sensitive: true,
        });

        new TerraformOutput(this, "user_login_names", {
            value: this.createdUser.loginNames,
            description: "The login names of the created user",
            sensitive: true,
        });

        new TerraformOutput(this, "user_password", {
            value: this.createdUser.initialPassword,
            description: "The password of the created user",
            sensitive: true,
        });

        new TerraformOutput(this, "user_preferred_login_name", {
            value: this.createdUser.preferredLoginName,
            description: "The preferred login name of the created user",
            sensitive: true,
        });

        new TerraformOutput(this, "user_state", {
            value: this.createdUser.state,
            description: "The state of the created user",
            sensitive: true,
        });

        new TerraformOutput(this, "created_org", {
            value: {
                id: this.createdOrg.id
            },
            description: "The client ID of the OIDC application",
            sensitive: true,
        });

        new TerraformOutput(this, "created_project", {
            value: {
                id: this.createdProject.id,
                name: this.createdProject.name,
            },
            description: "The client ID of the OIDC application",
            sensitive: true,
        });

    }
}

const app = new App();

new ZitadelStack(app, "zitadel-dev");

app.synth();






