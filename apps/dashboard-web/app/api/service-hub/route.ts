import { fail, ok } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { getServiceHubBootstrap } from "@/lib/service-hub";

export const runtime = "nodejs";
export const preferredRegion = "icn1";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }

  return ok(await getServiceHubBootstrap(session));
}
