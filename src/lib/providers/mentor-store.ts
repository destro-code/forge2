import { createLocalStore } from "../local-store";
import type { MentorConversation } from "../types";

export const mentorStore = createLocalStore<{
  conversations: MentorConversation[];
  activeId: string | null;
}>("forge:mentor:v1", {
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
});
