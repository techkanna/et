import { create } from "zustand";

export type SessionStatus = "idle" | "listening" | "thinking" | "speaking";

export interface TimelineMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
}

interface SpeakingState {
  conversationId: number | null;
  status: SessionStatus;
  messages: TimelineMessage[];
  liveTranscript: string;
  setConversationId: (id: number) => void;
  setStatus: (status: SessionStatus) => void;
  setLiveTranscript: (text: string) => void;
  addMessage: (message: TimelineMessage) => void;
  reset: () => void;
}

export const useSpeakingStore = create<SpeakingState>((set) => ({
  conversationId: null,
  status: "idle",
  messages: [],
  liveTranscript: "",
  setConversationId: (id) => set({ conversationId: id }),
  setStatus: (status) => set({ status }),
  setLiveTranscript: (text) => set({ liveTranscript: text }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  reset: () =>
    set({
      conversationId: null,
      status: "idle",
      messages: [],
      liveTranscript: "",
    }),
}));
