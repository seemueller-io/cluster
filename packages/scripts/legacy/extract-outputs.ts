// Legacy: not used

// #!/usr/bin/env bun
//
// import * as fs from 'fs';
// import * as path from 'path';
//
// interface TerraformOutput {
//     value: any;
//     type: string | string[];
//     sensitive?: boolean;
// }
//
// interface TerraformState {
//     outputs: Record<string, TerraformOutput>;
// }
//
// export function extractOutputsToFile(successfulDeploy: boolean = true ) {
//     if(!successfulDeploy) {
//         console.log("[INFO] Skipping outputs extraction, because the deployment was not successful.")
//         return
//     }
//     const stateFilePath = path.join(__dirname, 'terraform.zitadel-dev.tfstate');
//     const outputFilePath = path.join(__dirname, 'terraform-outputs.json');
//
//     try {
//         // Read the terraform state file
//         const stateContent = fs.readFileSync(stateFilePath, 'utf-8');
//         const state: TerraformState = JSON.parse(stateContent);
//
//         // Extract outputs with their values (unmasked)
//         const outputs: Record<string, any> = {};
//
//         for (const [key, output] of Object.entries(state.outputs)) {
//             outputs[key] = {
//                 value: output.value,
//                 type: output.type,
//                 sensitive: output.sensitive || false
//             };
//         }
//
//         // Write outputs to file
//         fs.writeFileSync(outputFilePath, JSON.stringify(outputs, null, 2));
//
//         console.log(`✅ Terraform outputs successfully written to: ${outputFilePath}`);
//         console.log(`📋 Extracted ${Object.keys(outputs).length} outputs:`);
//
//         // Display summary without showing sensitive values in console
//         for (const [key, output] of Object.entries(outputs)) {
//             if (output.sensitive) {
//                 console.log(`   - ${key}: [SENSITIVE - written to file unmasked]`);
//             } else {
//                 console.log(`   - ${key}: ${JSON.stringify(output.value)}`);
//             }
//         }
//
//     } catch (error) {
//         console.error('❌ Error extracting outputs:', error);
//         process.exit(1);
//     }
// }
//
// // Run the extraction
// extractOutputsToFile();