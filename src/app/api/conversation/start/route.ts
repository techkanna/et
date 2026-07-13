import { NextResponse } from "next/server";
import { createConversation } from "@/lib/db/queries/conversations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mode = typeof body.mode === "string" ? body.mode : "free";

  try {
    const conversation = createConversation(mode);
    return NextResponse.json({ conversationId: conversation.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
