import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Data</h1>
        <a
          href="/template-input-data-ads.xlsx"
          download
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download Template
        </a>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Template berisi sheet &quot;Petunjuk&quot; (cara isi + panduan kolom
        wajib per objective), &quot;Data Entry&quot; (isi di sini), dan
        &quot;Contoh Data&quot; (referensi 6 baris, satu per objective).
      </p>
      <UploadForm />
    </div>
  );
}
