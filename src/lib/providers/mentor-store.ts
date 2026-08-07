import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MentorConversation } from "../types";

export interface MentorState {
  conversations: MentorConversation[];
  activeId: string | null;
}

const DEFAULT_MENTOR_STATE: MentorState = {
  conversations: [
    {
      id: "welcome",
      title: "Welcome to Forge",
      updatedAt: Date.now(),
      messages: [
        {
          id: "m0",
          role: "assistant",
          createdAt: Date.now(),
          content:
            "Welcome to Forge. I'm your mentor — I coach more than I answer. Ask me anything about frontend engineering, or paste code and I'll review it.",
        },
      ],
    },
  ],
  activeId: "welcome",
};

export const useMentorZustandStore = create<
  MentorState & {
    setStateData: (data: MentorState) => void;
  }
>()(
  persist(
    (set) => ({
      ...DEFAULT_MENTOR_STATE,
      setStateData: (data) => set(data),
    }),
    {
      name: "forge:mentor:v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const mentorStore = {
  read: (): MentorState => useMentorZustandStore.getState(),
  write: (data: MentorState) => useMentorZustandStore.getState().setStateData(data),
  set: (data: MentorState) => useMentorZustandStore.getState().setStateData(data),
  useStore: (): [
    MentorState,
    (updater: MentorState | ((prev: MentorState) => MentorState)) => void,
  ] => {
    const state = useMentorZustandStore();
    return [
      state,
      (updater) => {
        const current = useMentorZustandStore.getState();
        const next = typeof updater === "function" ? updater(current) : updater;
        useMentorZustandStore.getState().setStateData(next);
      },
    ];
  },
};
