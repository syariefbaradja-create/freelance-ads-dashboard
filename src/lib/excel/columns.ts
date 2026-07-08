/**
 * Maps the template's Indonesian/English column headers (see
 * Template-Input-Data-Ads.xlsx, sheet "Data Entry") to internal field keys.
 * Matching is case-insensitive and ignores surrounding whitespace so minor
 * admin edits to the header row don't break parsing.
 */
export const COLUMN_HEADER_MAP: Record<string, string> = {
  "client name": "clientName",
  "platform": "platform",
  "objective": "objective",
  "campaign name": "campaignName",
  "date": "date",
  "spend": "spend",
  "impressions": "impressions",
  "reach": "reach",
  "frequency": "frequency",
  "clicks": "clicks",
  "post engagements": "postEngagements",
  "video views/thruplays": "videoViews",
  "leads": "leads",
  "conversions": "conversions",
  "purchases": "purchases",
  "catalog/product set name": "catalogName",
  "revenue (opsional)": "revenue",
  "revenue": "revenue",
};

// Derived columns present in the template (CPM, CTR, etc.) are computed by
// Excel formulas and intentionally excluded from COLUMN_HEADER_MAP above —
// they're never read, even if the uploaded file includes them.

export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}
