import type { LessonSessionState } from "./types";
import type { SessionPersistencePort } from "./persistence-port";

/**
 * Storage key prefix for lesson sessions.
 */
const STORAGE_PREFIX = "forge:session:";

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

      const parsed = JSON.parse(raw) as LessonSessionState;
      if (!parsed || typeof parsed !== "object" || !parsed.sessionId || !parsed.lessonId) {
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
              const parsed = JSON.parse(raw) as LessonSessionState;
              if (parsed && parsed.sessionId && parsed.lessonId) {
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
