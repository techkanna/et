import { NextResponse } from "next/server";
import { endConversation } from "@/lib/db/queries/conversations";
import { updateGoalProgress } from "@/lib/db/queries/daily-goals";

export async function POST(request: Request) {
  const body = await request.json();
  const conversationId = Number(body.conversationId);
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  try {
    const conversation = endConversation(conversationId);
    const durationMinutes = conversation.duration_seconds / 60;
    if (durationMinutes > 0) {
      updateGoalProgress(durationMinutes);
    }
    return NextResponse.json({ conversation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to end conversation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
