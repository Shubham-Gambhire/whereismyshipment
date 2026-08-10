import { createFileRoute } from "@tanstack/react-router";

import reportAsset from "@/assets/report.pdf.asset.json";

// Some ad/tracker blockers refuse to load URLs under the platform asset path
// (ERR_BLOCKED_BY_CLIENT). Proxying the PDF through a plain app route keeps it
// viewable on any browser or extension setup.
export const Route = createFileRoute("/project-report")({
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
            "content-type": "application/pdf",
            "content-disposition":
              'inline; filename="Where-Is-My-Shipment-Project-Development-Report.pdf"',
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
