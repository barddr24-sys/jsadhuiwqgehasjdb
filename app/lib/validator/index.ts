/**
 * Strict XSMB Validator & Data Integrity Module
 *
 * Provides deterministic, in-memory validation for normalized XSMB results.
 * Exposes core validator, conflict detector, error codes, and type contracts.
 */

// Core Contracts & Types
export * from './types';

// Constants & Versions
export * from './constants';

// Individual Validation Rules
export * from './rules/date-rule';
export * from './rules/tier-rule';
export * from './rules/source-rule';

// Multi-Source Conflict Detection
export * from './conflict-detector';

// Primary Validator
export * from './strict-xsmb-validator';
