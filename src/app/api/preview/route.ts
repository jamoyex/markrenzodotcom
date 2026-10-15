import { createPreviewHandlers } from "@/lib/server/preview-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handlers = createPreviewHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
