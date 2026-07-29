import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFlashcards } from "@/lib/hooks/use-content";
import { useState } from "react";
import { RotateCw, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards · Forge" },
      { name: "description", content: "Spaced repetition flashcards for rapid recall." },
      { property: "og:title", content: "Flashcards · Forge" },
      { property: "og:description", content: "Study smarter with spaced repetition." },
    ],
  }),
  component: Flashcards,
});

function Flashcards() {
  const cards = useFlashcards();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  const next = () => {
    setFlipped(false);
    setI((i + 1) % cards.length);
  };
  const prev = () => {
    setFlipped(false);
    setI((i - 1 + cards.length) % cards.length);
  };
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flashcards"
        title="Recall over recognition"
        description={`Card ${i + 1} of ${cards.length} · ${card.deck} deck`}
      />
      <div className="mx-auto max-w-2xl">
        <button className="w-full" onClick={() => setFlipped((f) => !f)} aria-label="Flip">
          <AnimatePresence mode="wait">
            <motion.div
              key={String(flipped) + i}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="min-h-[240px] border-border/60 shadow-elegant">
                <CardContent className="grid min-h-[240px] place-items-center p-8 text-center">
                  <div>
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      {flipped ? "Answer" : "Question"}
                    </div>
                    <div className="text-xl font-semibold">{flipped ? card.back : card.front}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </button>
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" onClick={prev}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Prev
          </Button>
          <Button variant="ghost" onClick={() => setFlipped((f) => !f)}>
            <RotateCw className="mr-2 h-4 w-4" />
            Flip
          </Button>
          <Button onClick={next}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {["Again", "Hard", "Good", "Easy"].map((r) => (
            <Button key={r} variant="outline" onClick={next}>
              {r}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
