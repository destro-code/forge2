import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, Code2, Sparkles } from "lucide-react";
import type { Lesson, Module, Topic } from "@/lib/types";

interface HeroStudioProps {
  lesson: Lesson;
  module?: Module;
  topic?: Topic;
  moduleLessonsCount?: number;
  currentStepNumber?: number;
  progressPercent?: number;
  isNewLearner?: boolean;
}

export function HeroStudio({ lesson, module, moduleLessonsCount = 1, currentStepNumber = 1, progressPercent = 0, isNewLearner = false }: HeroStudioProps) {
  const percent = Math.max(0, Math.min(100, progressPercent));
  return (
    <section aria-label="Your learning forge" className="forge-journey">
      <div className="forge-intro">
        <div className="forge-kicker"><Sparkles aria-hidden="true" /> YOUR LEARNING FORGE</div>
        <h1>Shape your <em>craft.</em></h1>
        <p>Build fluency through deliberate practice. Every node is a skill you can make your own.</p>
        <Link to="/playground" className="forge-text-action">Open playground <ArrowUpRight aria-hidden="true" /></Link>
      </div>

      <div className="forge-path-panel" aria-label="Learning path progress">
        <div className="forge-path-heading">
          <div><span>PATH / {module?.tags?.[0]?.toUpperCase() || "FRONTEND"}</span><h2>{module?.title || "The Web Forge"}</h2></div>
          <div className="forge-path-percent"><strong>{percent}%</strong><i><b style={{ width: `${percent}%` }} /></i></div>
        </div>
        <div className="forge-constellation">
          <span className="forge-path-label">YOUR PATH <b>→</b></span>
          <div className="forge-path-lines" aria-hidden="true"><i /><i /><i /><i /></div>
          <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} search={{ mode: "curriculum" }} className="forge-node forge-node-done" aria-label="Completed skill"><span>✓</span></Link>
          <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} search={{ mode: "curriculum" }} className="forge-node forge-node-done forge-node-two" aria-label="Completed skill"><span>✓</span></Link>
          <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} search={{ mode: "curriculum" }} className="forge-node forge-node-active" aria-label="Current skill"><Code2 aria-hidden="true" /></Link>
          <span className="forge-node forge-node-locked forge-node-three" aria-label="Locked skill">⌁</span>
          <span className="forge-node forge-node-locked forge-node-four" aria-label="Locked skill">⌁</span>
          <div className="forge-legend"><span className="done-dot" /> Mastered <span className="active-dot" /> In progress <span className="locked-dot" /> Locked</div>
        </div>
      </div>

      <div className="forge-focus-panel">
        <span className="forge-focus-kicker">CURRENT FOCUS <button type="button" aria-label="Dismiss current focus">×</button></span>
        <div className="forge-focus-icon"><Code2 aria-hidden="true" /></div>
        <h2>{lesson.title}</h2>
        <p>{lesson.description || "Learn to design frontend systems that stay flexible as your product grows."}</p>
        <div className="forge-focus-meta"><span><Clock aria-hidden="true" /> {lesson.estimatedMinutes || 20} min</span><span>⌁ {lesson.difficulty || "Intermediate"}</span></div>
        <Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} search={{ mode: "curriculum" }} className="forge-primary-action">{isNewLearner ? "Begin challenge" : "Continue challenge"}<span>▶</span></Link>
        <div className="forge-next"><span>Next up</span><strong>{moduleLessonsCount > currentStepNumber ? "The next skill in your path" : "Path complete"}</strong><span>⌑</span></div>
      </div>
    </section>
  );
}
