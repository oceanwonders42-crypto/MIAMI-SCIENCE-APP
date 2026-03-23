/**
 * Build a carrier tracking URL from carrier code + tracking number.
 * Falls back to 17track when carrier is unknown.
 */

function enc(s: string): string {
  return encodeURIComponent(s.trim());
}

export function getCarrierTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string | null | undefined
): string | null {
  if (!trackingNumber?.trim()) return null;
  const t = trackingNumber.trim();
  const c = (carrier ?? "").toLowerCase();

  if (c.includes("usps") || c === "stamps_com") {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc(t)}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${enc(t)}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${enc(t)}`;
  }
  if (c.includes("dhl")) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${enc(t)}`;
  }
  if (c.includes("ontrac")) {
    return `https://www.ontrac.com/tracking/?number=${enc(t)}`;
  }

  return `https://www.17track.net/en/track?nums=${enc(t)}`;
}
