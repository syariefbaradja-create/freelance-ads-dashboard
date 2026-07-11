"use client";

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
import type { TrendPoint } from "@/lib/metrics/trend";
import type { RawMetricValues } from "@/lib/metrics/summary";

export type TrendLine = {
  key: string;
  label: string;
  color: string;
  getValue: (raw: RawMetricValues) => number | null;
  format: (value: number | null) => string;
};

export function TrendChart({
  data,
  lines,
}: {
  data: TrendPoint[];
  lines: TrendLine[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500">Belum ada data untuk grafik.</p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card w-full p-4">
        <p className="text-sm text-slate-500">
          Klik salah satu kartu metrik di atas untuk menampilkannya di
          grafik (maks. 2 sekaligus).
        </p>
      </div>
    );
  }

  return (
    <div className="card w-full p-4">
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
              formatter={(value, name, item) => {
                const line = lines.find((l) => l.label === name);
                const raw =
                  typeof value === "number"
                    ? value
                    : Array.isArray(value)
                      ? Number(value[0])
                      : Number(value);
                return line ? line.format(raw) : item.value;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {lines.map((line, index) => (
              <Line
                key={line.key}
                yAxisId={index === 0 ? "left" : "right"}
                type="monotone"
                dataKey={line.getValue}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
