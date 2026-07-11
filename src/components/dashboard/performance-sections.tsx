"use client";

import { useMemo, useState } from "react";
import { buildSummaryGroups } from "@/lib/metrics/build-summary-groups";
import { objectiveSummaryTitle, type MetricRow } from "@/lib/metrics/summary";
import type { CampaignRow } from "@/lib/metrics/campaign-row";
import { ObjectivePanel } from "./objective-panel";
import { CampaignList } from "./campaign-list";

/**
 * Owns which campaigns are "checked" (personal, resets on reload — see
 * CampaignList's checkboxes) and recomputes the per-objective cards/trend
 * from just those campaigns, so two campaigns sharing an objective (e.g. a
 * real campaign and a "Test" one) don't have to always be lumped together.
 */
export function PerformanceSections({
  campaigns,
  metricsByCampaign,
  granularity,
}: {
  campaigns: CampaignRow[];
  metricsByCampaign: [string, MetricRow[]][];
  granularity: "daily" | "weekly";
}) {
  const metricsMap = useMemo(
    () => new Map(metricsByCampaign),
    [metricsByCampaign]
  );

  // Excluded (not selected) campaign ids — empty by default so everything
  // is included until someone unchecks something themselves.
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  const toggleCampaign = (campaignId: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  };

  const selectedIds = useMemo(
    () =>
      new Set(
        campaigns.filter((c) => !excludedIds.has(c.id)).map((c) => c.id)
      ),
    [campaigns, excludedIds]
  );

  const filteredCampaigns = useMemo(
    () => campaigns.filter((c) => selectedIds.has(c.id)),
    [campaigns, selectedIds]
  );

  const summaryGroups = useMemo(
    () => buildSummaryGroups(filteredCampaigns, metricsMap, granularity),
    [filteredCampaigns, metricsMap, granularity]
  );

  return (
    <>
      {summaryGroups.map((group) => (
        <section key={group.objective}>
          <h2 className="mb-3 section-title">
            {objectiveSummaryTitle(group.objective)}
          </h2>
          <ObjectivePanel
            objective={group.objective}
            cards={group.cards}
            trend={group.trend}
          />
        </section>
      ))}

      <CampaignList
        campaigns={campaigns}
        metricsByCampaign={metricsMap}
        selectedIds={selectedIds}
        onToggle={toggleCampaign}
      />
    </>
  );
}
