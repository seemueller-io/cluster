// Legacy: not used
// #!/usr/bin/env bun
//
// import {readFileSync, writeFileSync} from "fs";
// import {execSync} from "child_process";
//
//
// export function configureDevVars() {
//     const terraformOutputs = JSON.parse(readFileSync("terraform-outputs.json", 'utf-8'));
//
//     interface DevVarsConfig {
//         CLIENT_ID: string;
//         CLIENT_SECRET: string;
//         AUTH_SERVER_URL: string;
//         APP_URL: string;
//         DEV_MODE: string;
//         ZITADEL_ORG_ID: string;
//         ZITADEL_PROJECT_ID: string;
//     }
//
//     const destinationConfig: DevVarsConfig = {
//         CLIENT_ID: terraformOutputs.client_id.value,
//         CLIENT_SECRET: terraformOutputs.client_secret.value,
//         AUTH_SERVER_URL: "https://machine.127.0.0.1.sslip.io",
//         APP_URL: "http://localhost:8787",
//         DEV_MODE: "true",
//         ZITADEL_ORG_ID: terraformOutputs.created_org.value.id,
//         ZITADEL_PROJECT_ID: terraformOutputs.created_project.value.id,
//     }
//
//     const repoRoot = execSync('git rev-parse --show-toplevel').toString().trim();
//     const formattedConfig = Object.entries(destinationConfig)
//         .map(([key, value]) => `${key}="${value}"`)
//         .join('\n');
//
//     writeFileSync(`${repoRoot}/.dev.vars`, formattedConfig);
// }
//
// configureDevVars()