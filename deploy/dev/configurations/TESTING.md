# Testing Guide for Zitadel Configurator

This document explains the testing approach and methodology used in the Zitadel Configurator project, which uses CDKTF (Cloud Development Kit for Terraform) to manage Zitadel infrastructure.

## Overview

The project uses **unit testing** with Jest to test Infrastructure as Code (IaC) definitions. Tests verify that the synthesized Terraform configuration contains the expected resources and properties without creating actual cloud resources.

## Testing Framework

### Core Technologies
- **Jest**: JavaScript testing framework
- **ts-jest**: TypeScript support for Jest
- **CDKTF Testing**: Built-in testing utilities for CDKTF applications
- **TypeScript**: Primary language for both implementation and tests

### Configuration Files
- `jest.config.js`: Jest configuration with TypeScript support
- `setup.js`: CDKTF-specific Jest setup that enables testing matchers
- `package.json`: Test scripts and dependencies

## Test Structure

### Directory Organization
```
zitadel-configurator/
├── __tests__/           # Test files directory
│   └── main.test.ts     # Main test suite
├── main.ts              # Implementation to be tested
├── jest.config.js       # Jest configuration
└── setup.js            # CDKTF Jest setup
```

### Test File Naming
- Tests are located in the `__tests__/` directory
- Test files follow the pattern: `*.test.ts`
- Alternative patterns supported: `*.spec.ts`

## Running Tests

### Available Commands
```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

### Test Output
Tests provide clear feedback about:
- Resource creation verification
- Property validation
- Synthesized Terraform configuration structure

## Testing Approach

### Unit Testing Philosophy
The project follows a **unit testing** approach where:
- Tests validate the synthesized Terraform configuration
- No actual cloud resources are created during testing
- Fast execution with immediate feedback
- Focus on infrastructure definition correctness

### Test Categories

#### 1. Resource Existence Tests
Verify that expected resources are created in the Terraform configuration:
```typescript
it("should create an organization resource", () => {
  const app = Testing.app();
  const stack = new ZitadelStack(app, "test-stack");
  
  // Test that the stack contains an Org resource
  expect(Testing.synth(stack)).toHaveResource(Org);
});
```

#### 2. Resource Property Tests
Validate that resources have the correct properties:
```typescript
it("should create organization with name 'makers'", () => {
  const app = Testing.app();
  const stack = new ZitadelStack(app, "test-stack");
  
  // Test the synthesized terraform to ensure it contains the expected resource properties
  expect(Testing.synth(stack)).toHaveResourceWithProperties(Org, {
    name: "makers"
  });
});
```

#### 3. Public Interface Tests
Verify that the stack exposes the expected outputs:
```typescript
it("should create organization with name 'makers'", () => {
  const app = Testing.app();
  const stack = new ZitadelStack(app, "test-stack");
  
  // Verify the organization was created and stored
  expect(stack.createdOrg).toBeDefined();
});
```

## CDKTF Testing Utilities

### Key Testing Methods

#### `Testing.app()`
Creates a CDKTF app instance for testing purposes.

#### `Testing.synth(stack)`
Synthesizes the stack into Terraform JSON configuration for testing.

#### `toHaveResource(ResourceClass)`
Custom Jest matcher that checks if the synthesized configuration contains a specific resource type.

#### `toHaveResourceWithProperties(ResourceClass, properties)`
Custom Jest matcher that validates both resource existence and specific property values.

### Setup Requirements
The `setup.js` file is crucial as it:
```javascript
const cdktf = require("cdktf");
cdktf.Testing.setupJest();
```
This enables CDKTF-specific Jest matchers and testing utilities.

## Best Practices

### 1. Test Structure
- Use descriptive test suite names (`describe` blocks)
- Write clear, specific test case descriptions
- Group related tests logically

### 2. Test Isolation
- Each test creates its own app and stack instance
- Tests are independent and don't share state
- Use fresh instances for each test case

### 3. Comprehensive Coverage
- Test resource creation
- Validate resource properties
- Verify public interfaces and outputs
- Test different configuration scenarios

### 4. Meaningful Assertions
- Test both existence and correctness
- Use specific matchers for clear error messages
- Validate the actual synthesized configuration

## Example Test Implementation

```typescript
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { Testing } from "cdktf";
import { ZitadelStack } from "../main";
import { Org } from "../.gen/providers/zitadel/org";

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
  });
});
```

## Benefits of This Testing Approach

### 1. Fast Feedback
- Tests run quickly without cloud API calls
- Immediate validation of infrastructure definitions
- Suitable for continuous integration

### 2. Cost-Effective
- No cloud resources created during testing
- No API rate limits or costs
- Safe for frequent execution

### 3. Reliable
- Tests are deterministic and repeatable
- No dependency on external services during testing
- Consistent results across different environments

### 4. Development-Friendly
- Supports test-driven development (TDD)
- Watch mode for rapid iteration
- Clear error messages for debugging

## Extending Tests

### Adding New Test Cases
When adding new resources or modifying existing ones:

1. **Test Resource Creation**: Verify the new resource type exists
2. **Test Properties**: Validate all important configuration properties
3. **Test Relationships**: Verify resource dependencies and references
4. **Test Public Interface**: Ensure any exposed outputs are accessible

### Advanced Testing Scenarios
Consider adding tests for:
- Error conditions and validation
- Different configuration environments
- Resource dependencies and relationships
- Complex property calculations

## Troubleshooting

### Common Issues

#### Missing CDKTF Setup
If you see errors about missing matchers, ensure `setup.js` is properly configured in `jest.config.js`.

#### TypeScript Compilation Errors
Ensure all necessary type definitions are imported:
```typescript
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
```

#### Resource Import Issues
Verify that generated provider resources are properly imported:
```typescript
import { Org } from "../.gen/providers/zitadel/org";
```

This testing approach ensures robust, reliable infrastructure definitions while maintaining development velocity and cost-effectiveness.