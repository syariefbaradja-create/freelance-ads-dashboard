import {
  OBJECTIVE_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_LABELS,
  PLATFORM_VALUES,
} from "@/lib/metrics/objective";

export function FilterBar({
  platform,
  objective,
  granularity,
  from,
  to,
}: {
  platform: string;
  objective: string;
  granularity: string;
  from: string;
  to: string;
}) {
  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div>
        <label
          htmlFor="from"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Dari Tanggal
        </label>
        <input
          id="from"
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        />
      </div>
      <div>
        <label
          htmlFor="to"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Sampai Tanggal
        </label>
        <input
          id="to"
          name="to"
          type="date"
          defaultValue={to}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        />
      </div>
      <div>
        <label
          htmlFor="platform"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Platform
        </label>
        <select
          id="platform"
          name="platform"
          defaultValue={platform}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
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
        <label
          htmlFor="objective"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Objective
        </label>
        <select
          id="objective"
          name="objective"
          defaultValue={objective}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        >
          <option value="all">Semua</option>
          {OBJECTIVE_VALUES.map((value) => (
            <option key={value} value={value}>
              {OBJECTIVE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="granularity"
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          Granularitas Grafik
        </label>
        <select
          id="granularity"
          name="granularity"
          defaultValue={granularity}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
        >
          <option value="weekly">Mingguan</option>
          <option value="daily">Harian</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Terapkan
      </button>
    </form>
  );
}
