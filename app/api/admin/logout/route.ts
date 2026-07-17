import { NextResponse } from "next/server";
import { apagarSessaoAdmin } from "@/lib/adminSession";

export const dynamic = "force-dynamic";

export async function POST() {
  await apagarSessaoAdmin();
  return NextResponse.json({ ok: true }, { status: 200 });
}
