import type { Objective, Platform } from "./objective";

export type CampaignRow = {
  id: string;
  name: string;
  platform: Platform;
  objective: Objective;
  catalog_name: string | null;
  /** Only populated where the caller shows campaigns across multiple
   * clients (the admin overview) — the client-facing dashboard omits it
   * since it's always the logged-in client's own name. */
  clientName?: string;
};
