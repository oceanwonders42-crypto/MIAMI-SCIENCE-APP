/**
 * Integration service layer — normalized app-friendly data from external APIs.
 * Clients (woocommerce-client, shipstation-client, square-client) stay raw;
 * services convert to shapes usable for catalog sync, order sync, shipment sync.
 */

export * from "./product-service";
export * from "./order-service";
export * from "./shipment-service";
export * from "./invoice-service";
