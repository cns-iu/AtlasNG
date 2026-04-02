# @atlasng/analytics

A opinionated Angular library for logging user interactions and managing privacy consent. This library provides a robust foundation for tracking user behavior while respecting privacy preferences and compliance requirements.

## Overview

The analytics library enables applications to:

- **Log User Interactions**: Track user actions, events, and behavior patterns across your application
- **Manage Privacy Consent**: Handle user consent preferences with built-in consent management and GDPR compliance support
- **Flexible Configuration**: Easily configure analytics providers and privacy settings
- **Custom Events**: Create new events with custom properties and metadata

## Installation

```bash
npm install @atlasng/analytics
```

## Usage

### Configuration

Use `provideAnalytics` to configure the analytics system. It accepts zero or more feature functions.

Each feature is enabled by passing a `withXyz(...)` function, where `Xyz` is the feature name.

```ts
import { provideAnalytics, withErrorHandler, withDebugLogging } from '@your-org/analytics';

bootstrapApplication(AppComponent, {
  providers: [provideAnalytics(withErrorHandler(), withDebugLogging())],
});
```

### TODO: Managing consent

### TODO: Logging events

### TODO: Creating custom events
