import { NextResponse } from "next/server";
import {
  getTodayGoal,
  updateGoalProgress,
} from "@/lib/db/queries/daily-goals";

export async function GET() {
  const goal = getTodayGoal();
  if (!goal) {
    return NextResponse.json({ error: "No user or goal found" }, { status: 404 });
  }
  return NextResponse.json({ goal });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const minutes = Number(body.minutes);
  if (!minutes || minutes <= 0) {
    return NextResponse.json(
      { error: "minutes must be a positive number" },
      { status: 400 },
    );
  }

  try {
    const goal = updateGoalProgress(minutes);
    return NextResponse.json({ goal });
  } catch {
    return NextResponse.json({ error: "Failed to update goal" }, { status: 404 });
  }
}
