import { NextResponse } from "next/server";
import { readAudioFile } from "@/lib/storage/audio";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await params;
  const relativePath = `audio/${pathSegments.join("/")}`;
  const file = readAudioFile(relativePath);

  if (!file) {
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
