import { listCustomers } from "@/lib/accounts";
import { ok } from "@/lib/http";
import { handle } from "@/lib/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = handle(async () => ok(await listCustomers(), "العملاء المسجلين"));
