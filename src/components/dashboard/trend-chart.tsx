"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendFieldKey, TrendPoint } from "@/lib/metrics/trend";
import { METRIC_FIELD_LABELS, type MetricFieldKey } from "@/lib/metrics/objective";

function fieldLabel(field: TrendFieldKey): string {
  return field === "spend" ? "Spend" : METRIC_FIELD_LABELS[field];
}

export function TrendChart({
  data,
  fields,
  defaultField,
}: {
  data: TrendPoint[];
  fields: MetricFieldKey[];
  defaultField: MetricFieldKey;
}) {
  const options: TrendFieldKey[] = ["spend", ...fields];
  const [lineOne, setLineOne] = useState<TrendFieldKey>("spend");
  const [lineTwo, setLineTwo] = useState<TrendFieldKey>(defaultField);

  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500">Belum ada data untuk grafik.</p>
    );
  }

  return (
    <div className="card w-full p-4">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Garis 1</span>
          <select
            value={lineOne}
            onChange={(e) => setLineOne(e.target.value as TrendFieldKey)}
            className="select-field py-1 text-sm"
          >
            {options.map((field) => (
              <option key={field} value={field}>
                {fieldLabel(field)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Garis 2</span>
          <select
            value={lineTwo}
            onChange={(e) => setLineTwo(e.target.value as TrendFieldKey)}
            className="select-field py-1 text-sm"
          >
            {options.map((field) => (
              <option key={field} value={field}>
                {fieldLabel(field)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={lineOne}
              name={fieldLabel(lineOne)}
              stroke="#f97316"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={lineTwo}
              name={fieldLabel(lineTwo)}
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
