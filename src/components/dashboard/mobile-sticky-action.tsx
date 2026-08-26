import type { Lesson } from "@/lib/types";

interface MobileStickyActionProps {
  lesson: Lesson;
  isNewLearner?: boolean;
}

/**
 * MobileStickyAction neutralized — fixed overlay removed in favor of inlined action in Roadmap.
 */
export function MobileStickyAction(_props: MobileStickyActionProps) {
  return null;
}
