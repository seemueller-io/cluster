// Legacy: not used
// Intended to run the entire deployment process and generate artifacts for client applications without requiring developer intervention

// #!/usr/bin/env bun
//
// import {execSync} from "child_process";
//
// function deployCdktf() {
//     execSync("cdktf deploy --auto-approve", {stdio: "inherit"})
//     execSync("./extract-outputs.ts", {stdio: "inherit"})
//     execSync("./update-vars.ts", {stdio: "inherit"})
// }
//
// deployCdktf()