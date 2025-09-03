// File: lib/structure/index.ts

/**
 * @file Manually curated barrel for structure exports.
 * Replaces the old barrelsby output and removes ./constants/network.
 */

// Core enums & types
export * from "./enums/enums";
export * from "./enums/networkIds";
export * from "./enums/spCoinDisplay";
export * from "./types";

// Constants
export * from "./constants/addresses";

// Asset Selection (explicit exports to avoid missing leaf modules)
export * from "./assetSelection/index";
export * from "./assetSelection/constants/index";
export * from "./assetSelection/constants/keys";
export * from "./assetSelection/enums/index";
export * from "./assetSelection/enums/inputState";
export * from "./assetSelection/types/index";
export * from "./assetSelection/types/context";
