import {
  OBJECTIVE_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_LABELS,
  PLATFORM_VALUES,
  type Objective,
} from "@/lib/metrics/objective";
import { ObjectiveMultiSelect } from "@/components/objective-multi-select";

export function FilterBar({
  platform,
  objectives,
  granularity,
  from,
  to,
}: {
  platform: string;
  objectives: Objective[];
  granularity: string;
  from: string;
  to: string;
}) {
  return (
    <form method="GET" className="card flex flex-wrap items-end gap-4 p-4">
      <div>
        <label htmlFor="from" className="field-label">
          Dari Tanggal
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="input-field py-1.5"
        />
      </div>
      <div>
        <label htmlFor="to" className="field-label">
          Sampai Tanggal
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="input-field py-1.5"
        />
      </div>
      <div>
        <label htmlFor="platform" className="field-label">
          Platform
        </label>
        <select
          id="platform"
          name="platform"
          defaultValue={platform}
          className="select-field py-1.5"
        >
          <option value="all">Semua</option>
          {PLATFORM_VALUES.map((value) => (
            <option key={value} value={value}>
              {PLATFORM_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="field-label">Objective</label>
        <ObjectiveMultiSelect
          name="objective"
          options={OBJECTIVE_VALUES.map((value) => ({
            value,
            label: OBJECTIVE_LABELS[value],
          }))}
          defaultValues={objectives}
        />
      </div>
      <div>
        <label htmlFor="granularity" className="field-label">
          Granularitas Grafik
        </label>
        <select
          id="granularity"
          name="granularity"
          defaultValue={granularity}
          className="select-field py-1.5"
        >
          <option value="weekly">Mingguan</option>
          <option value="daily">Harian</option>
        </select>
      </div>
      <button type="submit" className="btn-primary py-1.5">
        Terapkan
      </button>
    </form>
  );
}
