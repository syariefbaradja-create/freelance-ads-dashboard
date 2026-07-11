"use client";

import { useMemo, useState } from "react";
import type { Objective } from "@/lib/metrics/objective";
import {
  getObjectiveMetricDescriptors,
  type SummaryCard,
} from "@/lib/metrics/summary";
import { OBJECTIVE_PRIMARY_FIELD, type TrendPoint } from "@/lib/metrics/trend";
import { TrendChart, type TrendLine } from "./trend-chart";

// Same orange/indigo pair the old Garis 1/Garis 2 dropdowns used, so the
// chart's look doesn't change — only how you pick what's on it.
const SLOT_LINE_COLORS = ["#f97316", "#4f46e5"];
const SLOT_CARD_CLASSES = [
  "border-orange-500 ring-1 ring-orange-500",
  "border-indigo-600 ring-1 ring-indigo-600",
];

/**
 * Google-Ads-style clickable stat cards: click a card to plot it on the
 * chart (max 2 at once — a 3rd click drops the oldest selection). Replaces
 * the previous Garis 1/Garis 2 dropdown selectors entirely.
 */
export function ObjectivePanel({
  objective,
  cards,
  trend,
}: {
  objective: Objective;
  cards: SummaryCard[];
  trend: TrendPoint[];
}) {
  const descriptors = useMemo(
    () => getObjectiveMetricDescriptors(objective),
    [objective]
  );

  const [activeKeys, setActiveKeys] = useState<string[]>(() => [
    "spend",
    OBJECTIVE_PRIMARY_FIELD[objective],
  ]);

  const toggleKey = (key: string) => {
    setActiveKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length < 2) {
        return [...prev, key];
      }
      return [prev[1], key];
    });
  };

  const lines: TrendLine[] = activeKeys
    .map((key, slot) => {
      const descriptor = descriptors.find((d) => d.key === key);
      if (!descriptor) return null;
      return {
        key: descriptor.key,
        label: descriptor.label,
        color: SLOT_LINE_COLORS[slot],
        getValue: descriptor.getValue,
        format: descriptor.format,
      };
    })
    .filter((line): line is TrendLine => line != null);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => {
          const slot = activeKeys.indexOf(card.key);
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => toggleKey(card.key)}
              className={`card p-4 text-left transition-colors ${
                slot >= 0 ? SLOT_CARD_CLASSES[slot] : "hover:border-slate-300"
              }`}
            >
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </button>
          );
        })}
      </div>
      <TrendChart data={trend} lines={lines} />
    </>
  );
}
