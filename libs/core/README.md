# @atlasng/core

The foundational Angular library for the AtlasNG platform. This library establishes the root application infrastructure — configuration providers, dependency injection tokens, environment handling, and base services that every application and library in the monorepo depends on.

## Overview

The core library provides:

- **Application Bootstrap**: `provideAtlasNg()` and related provider functions for configuring the platform at startup
- **Environment Handling**: Typed environment configuration with support for development, staging, and production contexts
- **Base Services**: Root-level services for logging, error handling, and application lifecycle management
- **Interceptors & Guards**: HTTP interceptors and global route guards applied across all applications

## Installation

```bash
npm install @atlasng/core
```

## Usage

### Configuration

Use `provideAtlasNg()` to configure the platform at application bootstrap:

```ts
import { provideAtlasNg } from '@atlasng/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideAtlasNg()
  ]
});
```

### TODO: Environment Configuration

### TODO: Dependency Injection Tokens

### TODO: Error Handling

