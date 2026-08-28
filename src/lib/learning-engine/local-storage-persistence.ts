import type { LessonSessionState } from "./types";
import type { SessionPersistencePort } from "./persistence-port";

/**
 * Storage key prefix for lesson sessions.
 */
const STORAGE_PREFIX = "forge:session:";
const SESSION_STATUSES = new Set(["not-started", "in-progress", "completed"]);
const ACTIVITY_STATUSES = new Set([
  "idle",
  "engaged",
  "evaluating",
  "passed",
  "failed",
  "retrying",
  "completed",
]);

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPersistedSession(value: unknown): value is LessonSessionState {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<LessonSessionState>;
  if (
    typeof session.sessionId !== "string" ||
    session.sessionId.length === 0 ||
    typeof session.lessonId !== "string" ||
    session.lessonId.length === 0 ||
    !SESSION_STATUSES.has(session.status ?? "") ||
    !Array.isArray(session.activityOrder) ||
    session.activityOrder.length === 0 ||
    !Array.isArray(session.completedActivityIds) ||
    !session.activities ||
    typeof session.activities !== "object" ||
    typeof session.currentActivityId !== "string" ||
    !Number.isInteger(session.currentActivityIndex) ||
    session.currentActivityIndex < 0 ||
    session.currentActivityIndex >= session.activityOrder.length ||
    session.totalActivities !== session.activityOrder.length ||
    !isFiniteTimestamp(session.startedAt) ||
    !isFiniteTimestamp(session.lastActiveAt)
  ) {
    return false;
  }

  const order = session.activityOrder;
  if (new Set(order).size !== order.length || !order.includes(session.currentActivityId)) return false;
  if (session.status === "completed" && !isFiniteTimestamp(session.completedAt)) return false;
  if (session.completedActivityIds.some((id) => !order.includes(id))) return false;

  const activityMap = session.activities as Record<string, Partial<LessonSessionState["activities"][string]>>;
  if (Object.keys(activityMap).length !== order.length) return false;
  return order.every((activityId) => {
    const activity = activityMap[activityId];
    return Boolean(
      activity &&
        activity.activityId === activityId &&
        ACTIVITY_STATUSES.has(activity.status ?? "") &&
        Number.isInteger(activity.attempts) &&
        activity.attempts >= 0 &&
        Number.isInteger(activity.hintsRevealed) &&
        activity.hintsRevealed >= 0 &&
        isFiniteTimestamp(activity.startedAt),
    );
  });
}

/**
 * Browser LocalStorage Persistence Adapter for the Learning Experience Engine.
 *
 * Implements SessionPersistencePort for client-side web application runtime.
 * Handles SSR safety, JSON parsing errors, storage quota limits, deep cloning,
 * and key indexing gracefully.
 */
export class LocalStorageSessionPersistenceAdapter implements SessionPersistencePort {
  private prefix: string;

  constructor(prefix: string = STORAGE_PREFIX) {
    this.prefix = prefix;
  }

  /**
   * Safe check for window.localStorage availability.
   */
  private isAvailable(): boolean {
    try {
      return (
        typeof window !== "undefined" &&
        typeof window.localStorage !== "undefined" &&
        window.localStorage !== null
      );
    } catch {
      return false;
    }
  }

  /**
   * Helper to build storage key for a lesson ID.
   */
  private getKeyForLesson(lessonId: string): string {
    return `${this.prefix}${lessonId}`;
  }

  /**
   * Safely deep-clone a session state to enforce state boundaries.
   */
  private cloneSession(session: LessonSessionState): LessonSessionState {
    return JSON.parse(JSON.stringify(session)) as LessonSessionState;
  }

  public save(session: LessonSessionState): void {
    if (!this.isAvailable() || !session || !session.lessonId) return;

    try {
      const cloned = this.cloneSession(session);
      const key = this.getKeyForLesson(session.lessonId);
      window.localStorage.setItem(key, JSON.stringify(cloned));
    } catch (err) {
      // Gracefully capture QuotaExceededError or SecurityError without throwing
      console.warn(
        `[LocalStorageSessionPersistenceAdapter] Failed to save session for ${session.lessonId}:`,
        err,
      );
    }
  }

  public load(sessionId: string): LessonSessionState | null {
    if (!this.isAvailable() || !sessionId) return null;

    try {
      const allSessions = this.list();
      const match = allSessions.find((s) => s.sessionId === sessionId);
      return match ? this.cloneSession(match) : null;
    } catch {
      return null;
    }
  }

  public loadByLessonId(lessonId: string): LessonSessionState | null {
    if (!this.isAvailable() || !lessonId) return null;

    try {
      const key = this.getKeyForLesson(lessonId);
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!isValidPersistedSession(parsed) || parsed.lessonId !== lessonId) {
        return null;
      }

      return this.cloneSession(parsed);
    } catch (err) {
      console.warn(
        `[LocalStorageSessionPersistenceAdapter] Failed to load session for lesson ${lessonId}:`,
        err,
      );
      return null;
    }
  }

  public delete(sessionId: string): void {
    if (!this.isAvailable() || !sessionId) return;

    try {
      const all = this.list();
      const match = all.find((s) => s.sessionId === sessionId);
      if (match) {
        this.deleteByLessonId(match.lessonId);
      }
    } catch (err) {
      console.warn(
        `[LocalStorageSessionPersistenceAdapter] Failed to delete session ${sessionId}:`,
        err,
      );
    }
  }

  public deleteByLessonId(lessonId: string): void {
    if (!this.isAvailable() || !lessonId) return;

    try {
      const key = this.getKeyForLesson(lessonId);
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(
        `[LocalStorageSessionPersistenceAdapter] Failed to delete session for lesson ${lessonId}:`,
        err,
      );
    }
  }

  public list(): LessonSessionState[] {
    if (!this.isAvailable()) return [];

    const sessions: LessonSessionState[] = [];

    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            try {
              const parsed: unknown = JSON.parse(raw);
              if (isValidPersistedSession(parsed)) {
                sessions.push(this.cloneSession(parsed));
              }
            } catch {
              // Ignore malformed keys
            }
          }
        }
      }
    } catch (err) {
      console.warn("[LocalStorageSessionPersistenceAdapter] Failed to list sessions:", err);
    }

    return sessions;
  }

  public clear(): void {
    if (!this.isAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      for (const k of keysToRemove) {
        window.localStorage.removeItem(k);
      }
    } catch (err) {
      console.warn("[LocalStorageSessionPersistenceAdapter] Failed to clear sessions:", err);
    }
  }
}
