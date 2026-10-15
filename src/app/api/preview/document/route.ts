import { createPreviewHandlers } from "@/lib/server/preview-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createPreviewHandlers().DOCUMENT;
