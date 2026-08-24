import { LessonSessionState } from "./types";

/**
 * Persistence Port Interface for the Learning Experience Engine.
 *
 * Provides a clean storage abstraction boundary decoupling the deterministic
 * session engine from concrete storage mechanisms (in-memory, localStorage,
 * IndexedDB, or remote cloud database).
 */
export interface SessionPersistencePort {
  save(session: LessonSessionState): Promise<void> | void;
  load(sessionId: string): Promise<LessonSessionState | null> | LessonSessionState | null;
  loadByLessonId(lessonId: string): Promise<LessonSessionState | null> | LessonSessionState | null;
  delete(sessionId: string): Promise<void> | void;
  list(): Promise<LessonSessionState[]> | LessonSessionState[];
}

/**
 * In-Memory Persistence Adapter.
 *
 * Completely framework-independent, pure memory storage implementation
 * for unit testing, headless runners, and deterministic test scenarios.
 */
export class InMemorySessionPersistenceAdapter implements SessionPersistencePort {
  private sessions: Map<string, LessonSessionState> = new Map();

  public save(session: LessonSessionState): void {
    // Deep clone to ensure serialization safety and isolation
    const serialized = JSON.parse(JSON.stringify(session)) as LessonSessionState;
    this.sessions.set(serialized.sessionId, serialized);
  }

  public load(sessionId: string): LessonSessionState | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return JSON.parse(JSON.stringify(session)) as LessonSessionState;
  }

  public loadByLessonId(lessonId: string): LessonSessionState | null {
    // Return most recently updated session for the lesson
    let latestSession: LessonSessionState | null = null;

    for (const session of this.sessions.values()) {
      if (session.lessonId === lessonId) {
        if (!latestSession || session.lastActiveAt > latestSession.lastActiveAt) {
          latestSession = session;
        }
      }
    }

    if (!latestSession) return null;
    return JSON.parse(JSON.stringify(latestSession)) as LessonSessionState;
  }

  public delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  public list(): LessonSessionState[] {
    return Array.from(this.sessions.values()).map(
      (s) => JSON.parse(JSON.stringify(s)) as LessonSessionState,
    );
  }

  public clear(): void {
    this.sessions.clear();
  }
}
