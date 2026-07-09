"use client";

import { deleteTopup } from "@/lib/actions/topups";

export function DeleteTopupButton({
  topupId,
  clientId,
}: {
  topupId: string;
  clientId: string;
}) {
  return (
    <form
      action={deleteTopup.bind(null, topupId, clientId)}
      onSubmit={(e) => {
        if (!confirm("Hapus catatan top up ini?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-red-600 hover:text-red-800">
        Hapus
      </button>
    </form>
  );
}
