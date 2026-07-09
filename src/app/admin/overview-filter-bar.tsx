import {
  OBJECTIVE_LABELS,
  OBJECTIVE_VALUES,
  PLATFORM_LABELS,
  PLATFORM_VALUES,
} from "@/lib/metrics/objective";

export function OverviewFilterBar({
  clientId,
  clientsList,
  platform,
  objective,
  granularity,
  from,
  to,
}: {
  clientId: string;
  clientsList: { id: string; name: string; isActive: boolean }[];
  platform: string;
  objective: string;
  granularity: string;
  from: string;
  to: string;
}) {
  return (
    <form method="GET" className="card flex flex-wrap items-end gap-4 p-4">
      <div>
        <label htmlFor="clientId" className="field-label">
          Client
        </label>
        <select
          id="clientId"
          name="clientId"
          defaultValue={clientId}
          className="select-field py-1.5"
        >
          <option value="">Semua</option>
          {clientsList.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
              {!client.isActive ? " (nonaktif)" : ""}
            </option>
          ))}
        </select>
      </div>
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
        <label htmlFor="objective" className="field-label">
          Objective
        </label>
        <select
          id="objective"
          name="objective"
          defaultValue={objective}
          className="select-field py-1.5"
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
