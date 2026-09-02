/**
 * XSMB HTML Parser & Normalizer Module Entrypoint
 *
 * Exports parser contracts, types, error factories, text/date cleaners,
 * and concrete parser implementations.
 */

// Core Contracts & Types
export * from './types';

// Error Models & Factory
export * from './parser-errors';

// Normalizers & Utility Extractors
export * from './text-cleaner';
export * from './date-parser';
export * from './province-parser';

// Primary Web Parser & Selectors
export * from './primary/selectors';
export * from './primary/primary-xsmb-parser';
