import { NextResponse } from "next/server";
import {
  createUser,
  getUser,
  updateUser,
} from "@/lib/db/queries/users";
import { createUserSchema, updateUserSchema } from "@/lib/db/schema";

export async function GET() {
  const user = getUser();
  return NextResponse.json({ user });
}

export async function POST(request: Request) {
  const existing = getUser();
  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 },
    );
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = createUser(parsed.data);
  return NextResponse.json({ user }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const user = updateUser(parsed.data);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "No user found" }, { status: 404 });
  }
}
