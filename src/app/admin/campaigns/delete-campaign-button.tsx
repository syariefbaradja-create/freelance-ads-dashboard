"use client";

import { deleteCampaign } from "./actions";

export function DeleteCampaignButton({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  return (
    <form
      action={deleteCampaign.bind(null, campaignId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Hapus campaign "${campaignName}"? Semua data metrik harian di dalamnya ikut terhapus dan tidak bisa dikembalikan.`
          )
        ) {
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
