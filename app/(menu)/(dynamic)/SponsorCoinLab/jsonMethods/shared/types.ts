// File: app/(menu)/(dynamic)/SponsorCoinLab/methods/shared/types.ts
export type ParamType = 'address' | 'contract_address' | 'uint' | 'string' | 'bool' | 'address_array' | 'string_array' | 'date';

export type ParamDef = { label: string; placeholder: string; type: ParamType };

export type MethodDef = { title: string; params: ParamDef[]; executable?: boolean };
