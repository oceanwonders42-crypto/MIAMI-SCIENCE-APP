/** Unit options for new supplies (add flow). Edit flow also allows legacy units. */
export const SUPPLY_ADD_UNIT_OPTIONS = [
  "capsules",
  "ml",
  "vials",
  "tabs",
  "mg",
  "oz",
] as const;

export type SupplyAddUnit = (typeof SUPPLY_ADD_UNIT_OPTIONS)[number];
