import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/llm";
import { transcribe } from "@/lib/ai/stt";
import { synthesize } from "@/lib/ai/tts";
import type { ChatMessage } from "@/lib/ai/types";
import { getConversation } from "@/lib/db/queries/conversations";
import { addMessage, getRecentMessages, updateMessageAudioPath } from "@/lib/db/queries/messages";
import { getUser } from "@/lib/db/queries/users";
import { buildSystemPrompt } from "@/lib/prompt/system";
import {
  audioUrlFromPath,
  saveAiAudio,
  saveUserAudio,
} from "@/lib/storage/audio";

export async function POST(request: Request) {
  const formData = await request.formData();
  const conversationId = Number(formData.get("conversationId"));
  const audioFile = formData.get("audio");

  if (!conversationId || !(audioFile instanceof Blob)) {
    return NextResponse.json(
      { error: "conversationId and audio are required" },
      { status: 400 },
    );
  }

  const conversation = getConversation(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  const user = getUser();
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 404 });
  }

  try {
    const transcript = await transcribe(audioFile);

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    const userMessage = addMessage({
      conversationId,
      role: "user",
      text: transcript,
    });

    const userAudioPath = saveUserAudio(
      conversationId,
      userMessage.id,
      audioBuffer,
    );

    updateMessageAudioPath(userMessage.id, userAudioPath);

    const recentMessages = getRecentMessages(conversationId, 10);
    const chatMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(user) },
      ...recentMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      })),
    ];

    const teacherResponse = await chat(chatMessages);

    const assistantMessage = addMessage({
      conversationId,
      role: "assistant",
      text: teacherResponse.teacherReply,
      grammarScore: teacherResponse.scores.grammar,
      fluencyScore: teacherResponse.scores.fluency,
      metadata: {
        grammarCorrections: teacherResponse.grammarCorrections,
        newVocabulary: teacherResponse.newVocabulary,
        confidence: teacherResponse.scores.confidence,
      },
    });

    const ttsBuffer = await synthesize(teacherResponse.teacherReply);
    const aiAudioPath = saveAiAudio(
      conversationId,
      assistantMessage.id,
      Buffer.from(ttsBuffer),
    );
    updateMessageAudioPath(assistantMessage.id, aiAudioPath);

    return NextResponse.json({
      teacherReply: teacherResponse.teacherReply,
      transcript,
      audioUrl: audioUrlFromPath(aiAudioPath),
      scores: teacherResponse.scores,
      grammarCorrections: teacherResponse.grammarCorrections,
      newVocabulary: teacherResponse.newVocabulary,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
