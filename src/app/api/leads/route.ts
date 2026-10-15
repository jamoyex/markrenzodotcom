import { createLeadHandler } from "@/lib/server/lead-service";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const POST = createLeadHandler();
