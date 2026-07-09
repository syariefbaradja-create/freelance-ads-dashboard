"use client";

import { deleteMetric } from "@/lib/actions/metrics";

export function DeleteMetricButton({
  metricId,
  campaignId,
}: {
  metricId: string;
  campaignId: string;
}) {
  return (
    <form
      action={deleteMetric.bind(null, metricId, campaignId)}
      onSubmit={(e) => {
        if (!confirm("Hapus data harian ini?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="font-medium text-red-600 hover:text-red-700">
        Hapus
      </button>
    </form>
  );
}
