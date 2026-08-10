import { createFileRoute } from "@tanstack/react-router";

import reportAsset from "@/assets/report.pdf.asset.json";

export const Route = createFileRoute("/project-document")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const upstream = await fetch(new URL(reportAsset.url, origin).toString());
        if (!upstream.ok || !upstream.body) {
          return new Response("Report unavailable", { status: 502 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": "application/octet-stream",
            "content-disposition":
              'attachment; filename="Where-Is-My-Shipment-Project-Development-Report.pdf"',
            "cache-control": "public, max-age=3600",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});