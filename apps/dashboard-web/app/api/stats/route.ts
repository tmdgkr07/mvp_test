import { ok } from "@/lib/api-response";
import { getGlobalStats } from "@/lib/data-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const stats = await getGlobalStats();
    return ok(stats);
}
