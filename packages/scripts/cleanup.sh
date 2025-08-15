#!/usr/bin/env bash

echo "WARNING: This will remove all build artifacts, temporary directories, and cached files."
echo -n "Are you sure you want to proceed? (y/N): "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Clean up build artifacts and temporary directories
echo "Cleaning up build artifacts and temporary directories..."

# Remove persisted data
find . -name ".wrangler" -type d -prune -exec rm -rf {} \;

# Remove node_modules directories
find . -name "node_modules" -type d -prune -exec rm -rf {} \;

# Remove Rust stuff
find . -name "target" -type d -prune -exec rm -rf {} \;

# Remove old builds
find . -name "dist" -type d -prune -exec rm -rf {} \;
find . -name "build" -type d -prune -exec rm -rf {} \;

# Remove CDKTF generated files
find . -name ".gen" -type d -prune -exec rm -rf {} \;
find . -name "cdktf.out" -type d -prune -exec rm -rf {} \;
find . -name "*.out" -type f -exec rm -f {} \;

# Remove TypeScript build artifacts
find . -name "*.tsbuildinfo" -type f -exec rm -f {} \;

# Remove Terraform artifacts
find . -name "*.tfstate*" -type f -exec rm -f {} \;
find . -name "*.lock.hcl" -type f -exec rm -f {} \;
find . -name ".terraform" -type d -prune -exec rm -rf {} \;
find . -name ".terraform.lock.hcl" -type f -exec rm -f {} \;

# Remove test and coverage outputs
find . -name "coverage" -type d -prune -exec rm -rf {} \;
find . -name ".nyc_output" -type d -prune -exec rm -rf {} \;

# Remove cache directories
find . -name ".cache" -type d -prune -exec rm -rf {} \;
find . -name ".turbo" -type d -prune -exec rm -rf {} \;
find . -name ".next" -type d -prune -exec rm -rf {} \;

# Remove log files
find . -name "*.log" -type f -exec rm -f {} \;

echo "Cleanup complete!"
