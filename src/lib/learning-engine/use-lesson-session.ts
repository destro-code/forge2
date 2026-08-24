import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  CanonicalLesson,
  CanonicalActivity,
  Skill,
  Misconception,
} from "@/lib/curriculum/types";
import type {
  LessonSessionState,
  ActivitySessionState,
  LessonSessionProgress,
  ActivityEvaluationResult,
  LearningEvidenceToken,
  LessonObjectivesSummary,
  SkillMasteryRecord,
  MisconceptionMatchResult,
} from "./types";
import type { SessionPersistencePort } from "./persistence-port";
import { LocalStorageSessionPersistenceAdapter } from "./local-storage-persistence";
import {
  createLessonSession,
  startLessonSession,
  engageSessionActivity,
  startActivityEvaluation,
  resolveActivityEvaluation,
  retrySessionActivity,
  revealSessionActivityHint,
  completeSessionActivity,
  navigateToActivity,
  nextSessionActivity,
  previousSessionActivity,
  checkLessonCompletion,
  completeLessonSession,
  calculateSessionProgress,
} from "./session-engine";
import {
  generateEvidenceTokens,
  generateLessonEvidenceTokens,
  evaluateLessonObjectivesSatisfaction,
} from "./evidence-engine";
import { matchMisconception } from "./misconception-matcher";
import { aggregateAllSkillsMastery } from "./mastery-aggregator";
import { canonicalProvider } from "@/lib/curriculum/canonical-provider";

export interface UseLessonSessionOptions {
  persistenceAdapter?: SessionPersistencePort;
  skills?: Skill[];
  misconceptions?: Misconception[];
  onComplete?: () => void;
  autoSave?: boolean;
}

export interface ResolveEvaluationReturn {
  isPassed: boolean;
  evidenceTokens: LearningEvidenceToken[];
  misconceptionMatch: MisconceptionMatchResult | null;
}

export function useLessonSession(lesson: CanonicalLesson, options: UseLessonSessionOptions = {}) {
  const {
    skills = canonicalProvider.getSkills(),
    misconceptions = canonicalProvider.getMisconceptions(),
    onComplete,
    autoSave = true,
  } = options;

  // Stable persistence adapter ref
  const adapterRef = useRef<SessionPersistencePort>(
    options.persistenceAdapter || new LocalStorageSessionPersistenceAdapter(),
  );

  // Update adapter ref if option changes
  useEffect(() => {
    if (options.persistenceAdapter) {
      adapterRef.current = options.persistenceAdapter;
    }
  }, [options.persistenceAdapter]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Core session state
  const [session, setSession] = useState<LessonSessionState>(() => {
    const adapter = adapterRef.current;
    const existing = adapter.loadByLessonId(lesson.id);
    if (existing) {
      return startLessonSession(existing);
    }
    const fresh = createLessonSession(lesson);
    return startLessonSession(fresh);
  });

  // Evidence tokens accumulated in this session
  const [evidenceTokens, setEvidenceTokens] = useState<LearningEvidenceToken[]>(() => {
    const savedTokens = (session.metadata?.evidenceTokens as LearningEvidenceToken[]) || [];
    if (savedTokens.length > 0) {
      return savedTokens;
    }
    return generateLessonEvidenceTokens(lesson, session);
  });

  // Current matched misconception (if any)
  const [matchedMisconception, setMatchedMisconception] = useState<MisconceptionMatchResult | null>(
    null,
  );

  // Refs to ensure synchronous state chaining across method calls
  const sessionRef = useRef<LessonSessionState>(session);
  sessionRef.current = session;

  const evidenceTokensRef = useRef<LearningEvidenceToken[]>(evidenceTokens);
  evidenceTokensRef.current = evidenceTokens;

  // Synchronize or restore session when lesson changes
  useEffect(() => {
    setIsLoading(true);
    const adapter = adapterRef.current;
    const existing = adapter.loadByLessonId(lesson.id);

    let activeSession: LessonSessionState;
    if (existing) {
      activeSession = startLessonSession(existing);
    } else {
      activeSession = startLessonSession(createLessonSession(lesson));
    }

    sessionRef.current = activeSession;
    setSession(activeSession);

    const savedTokens = (activeSession.metadata?.evidenceTokens as LearningEvidenceToken[]) || [];
    const restoredTokens =
      savedTokens.length > 0 ? savedTokens : generateLessonEvidenceTokens(lesson, activeSession);
    evidenceTokensRef.current = restoredTokens;
    setEvidenceTokens(restoredTokens);
    setMatchedMisconception(null);
    setIsLoading(false);

    if (autoSave) {
      adapter.save(activeSession);
    }
  }, [lesson, autoSave]);

  // Save session state to persistence helper
  const persistSessionState = useCallback(
    (updatedSession: LessonSessionState, updatedTokens: LearningEvidenceToken[]) => {
      if (!autoSave) return;
      const sessionToSave: LessonSessionState = {
        ...updatedSession,
        metadata: {
          ...updatedSession.metadata,
          evidenceTokens: updatedTokens,
        },
      };
      adapterRef.current.save(sessionToSave);
    },
    [autoSave],
  );

  const updateSessionAndTokens = useCallback(
    (nextSession: LessonSessionState, nextTokens: LearningEvidenceToken[]) => {
      sessionRef.current = nextSession;
      evidenceTokensRef.current = nextTokens;
      setSession(nextSession);
      setEvidenceTokens(nextTokens);
      persistSessionState(nextSession, nextTokens);
    },
    [persistSessionState],
  );

  // Current activity object derived from session state
  const currentActivity: CanonicalActivity | undefined = useMemo(() => {
    if (!lesson || !lesson.activities) return undefined;
    return (
      lesson.activities.find((a) => a.id === session.currentActivityId) ||
      lesson.activities[session.currentActivityIndex] ||
      lesson.activities[0]
    );
  }, [lesson, session.currentActivityId, session.currentActivityIndex]);

  // Current activity session state
  const currentActivityState: ActivitySessionState | undefined = useMemo(() => {
    if (!currentActivity) return undefined;
    return session.activities[currentActivity.id];
  }, [session.activities, currentActivity]);

  // Session progress calculations
  const progress: LessonSessionProgress = useMemo(() => {
    return calculateSessionProgress(session);
  }, [session]);

  // Objective satisfaction summary
  const objectiveSummary: LessonObjectivesSummary = useMemo(() => {
    return evaluateLessonObjectivesSatisfaction(lesson, evidenceTokens);
  }, [lesson, evidenceTokens]);

  // Skill mastery aggregation
  const skillMastery: Record<string, SkillMasteryRecord> = useMemo(() => {
    return aggregateAllSkillsMastery(skills, evidenceTokens);
  }, [skills, evidenceTokens]);

  // Helper to target activity ID or current
  const getTargetActivityId = useCallback((activityId?: string): string => {
    return activityId || sessionRef.current.currentActivityId;
  }, []);

  // --- ACTIONS ---

  const engage = useCallback(
    (activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const currentResp = current.activities[targetId]?.response;
      const next = engageSessionActivity(current, targetId, currentResp);
      updateSessionAndTokens(next, evidenceTokensRef.current);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const updateResponse = useCallback(
    (response: unknown, activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const next = engageSessionActivity(current, targetId, response);
      updateSessionAndTokens(next, evidenceTokensRef.current);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const startEvaluation = useCallback(
    (activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const next = startActivityEvaluation(current, targetId);
      updateSessionAndTokens(next, evidenceTokensRef.current);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const resolveEvaluation = useCallback(
    (evaluation: ActivityEvaluationResult, activityId?: string): ResolveEvaluationReturn => {
      const targetId = getTargetActivityId(activityId);
      const targetActivity = lesson.activities.find((a) => a.id === targetId);

      let isPassed = false;
      let newEvidence: LearningEvidenceToken[] = [];
      let miscMatch: MisconceptionMatchResult | null = null;

      const current = sessionRef.current;
      let updatedTokens = [...evidenceTokensRef.current];
      let next = resolveActivityEvaluation(current, targetId, evaluation);

      if (evaluation.isValid) {
        isPassed = true;
        next = completeSessionActivity(next, targetId);

        if (targetActivity) {
          newEvidence = generateEvidenceTokens({
            lesson,
            activity: targetActivity,
            sessionState: next.activities[targetId],
          });

          if (newEvidence.length > 0) {
            const existingIds = new Set(updatedTokens.map((t) => t.evidenceId));
            for (const token of newEvidence) {
              if (!existingIds.has(token.evidenceId)) {
                updatedTokens.push(token);
              } else {
                updatedTokens = updatedTokens.map((t) =>
                  t.evidenceId === token.evidenceId ? token : t,
                );
              }
            }
          }
        }
        setMatchedMisconception(null);
      } else {
        isPassed = false;
        if (targetActivity && misconceptions.length > 0) {
          const currentResp = next.activities[targetId]?.response;
          const currentAttempts = next.activities[targetId]?.attempts || 1;
          miscMatch = matchMisconception(targetActivity, currentResp, evaluation, misconceptions, {
            attempts: currentAttempts,
          });
          setMatchedMisconception(miscMatch);
        }
      }

      updateSessionAndTokens(next, updatedTokens);

      return {
        isPassed,
        evidenceTokens: newEvidence,
        misconceptionMatch: miscMatch,
      };
    },
    [getTargetActivityId, lesson, misconceptions, updateSessionAndTokens],
  );

  const retry = useCallback(
    (activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const next = retrySessionActivity(current, targetId);
      updateSessionAndTokens(next, evidenceTokensRef.current);
      setMatchedMisconception(null);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const revealHint = useCallback(
    (activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const next = revealSessionActivityHint(current, targetId);
      updateSessionAndTokens(next, evidenceTokensRef.current);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const completeActivity = useCallback(
    (activityId?: string) => {
      const targetId = getTargetActivityId(activityId);
      const current = sessionRef.current;
      const next = completeSessionActivity(current, targetId);
      updateSessionAndTokens(next, evidenceTokensRef.current);
    },
    [getTargetActivityId, updateSessionAndTokens],
  );

  const goToActivity = useCallback(
    (target: number | string) => {
      const current = sessionRef.current;
      const next = navigateToActivity(current, target);
      updateSessionAndTokens(next, evidenceTokensRef.current);
      setMatchedMisconception(null);
    },
    [updateSessionAndTokens],
  );

  const goNext = useCallback(() => {
    const current = sessionRef.current;
    const next = nextSessionActivity(current);
    updateSessionAndTokens(next, evidenceTokensRef.current);
    setMatchedMisconception(null);
  }, [updateSessionAndTokens]);

  const goPrevious = useCallback(() => {
    const current = sessionRef.current;
    const next = previousSessionActivity(current);
    updateSessionAndTokens(next, evidenceTokensRef.current);
    setMatchedMisconception(null);
  }, [updateSessionAndTokens]);

  const completeLesson = useCallback(() => {
    const current = sessionRef.current;
    const check = checkLessonCompletion(current, lesson);
    if (!check.canComplete) {
      return false;
    }
    const next = completeLessonSession(current, lesson);
    updateSessionAndTokens(next, evidenceTokensRef.current);
    onComplete?.();
    return true;
  }, [lesson, updateSessionAndTokens, onComplete]);

  const saveSession = useCallback(() => {
    persistSessionState(sessionRef.current, evidenceTokensRef.current);
  }, [persistSessionState]);

  const resetSession = useCallback(() => {
    const adapter = adapterRef.current;
    const current = sessionRef.current;
    if (current.sessionId) {
      adapter.delete(current.sessionId);
    }

    const fresh = startLessonSession(createLessonSession(lesson));
    setMatchedMisconception(null);
    updateSessionAndTokens(fresh, []);
  }, [lesson, updateSessionAndTokens]);

  const getActivityState = useCallback(
    (activityId?: string): ActivitySessionState | undefined => {
      const targetId = getTargetActivityId(activityId);
      return sessionRef.current.activities[targetId];
    },
    [getTargetActivityId],
  );

  return {
    session,
    currentActivity,
    currentActivityState,
    getActivityState,
    progress,
    isLoading,

    engage,
    updateResponse,
    startEvaluation,
    resolveEvaluation,
    retry,
    revealHint,
    completeActivity,

    goNext,
    goPrevious,
    goToActivity,

    completeLesson,

    objectiveSummary,
    skillMastery,
    matchedMisconception,

    saveSession,
    resetSession,
  };
}
