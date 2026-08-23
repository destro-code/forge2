import academyData from "../../data/canonical/academy.json";
import levelsData from "../../data/canonical/levels.json";
import conceptsData from "../../data/canonical/concepts.json";
import skillsData from "../../data/canonical/skills.json";
import misconceptionsData from "../../data/canonical/misconceptions.json";
import topicsData from "../../data/canonical/topics.json";

import lessonWhatIsFrontend from "../../data/canonical/lessons/lesson-what-is-frontend-development.json";
import lessonElementsTags from "../../data/canonical/lessons/lesson-elements-tags-attributes.json";
import lessonCssFlexbox from "../../data/canonical/lessons/lesson-css-flexbox.json";
import lessonJsFunctions from "../../data/canonical/lessons/lesson-javascript-functions.json";
import lessonFixBrokenPage from "../../data/canonical/lessons/lesson-fix-the-broken-page.json";

import legacyLessonsData from "../../data/lessons.json";
import legacyModulesData from "../../data/modules.json";

import type {
  Academy,
  CanonicalLevel,
  CanonicalModule,
  CanonicalTopic,
  Concept,
  Skill,
  Misconception,
  CanonicalLesson,
} from "./types";
import {
  validateAcademy,
  validateLevel,
  validateConcept,
  validateSkill,
  validateMisconception,
  validateTopic,
  validateLesson,
  validateCurriculumIntegrity,
  type CurriculumIntegrityReport,
} from "./schema";
import { adaptLegacyLessonToCanonical } from "./legacy-adapter";
import type { Lesson as LegacyLesson } from "../types";

export class CanonicalProvider {
  private academy: Academy;
  private levels: CanonicalLevel[];
  private modules: CanonicalModule[];
  private topics: CanonicalTopic[];
  private concepts: Concept[];
  private skills: Skill[];
  private misconceptions: Misconception[];
  private goldenLessons: Map<string, CanonicalLesson> = new Map();
  private legacyLessons: Map<string, LegacyLesson> = new Map();

  constructor() {
    // Validate & Load Academy
    this.academy = validateAcademy(academyData as unknown);

    // Validate & Load Levels
    this.levels = (levelsData as unknown[]).map((lvl) => validateLevel(lvl));

    // Derive Canonical Modules from modules.json + levels
    this.modules = (legacyModulesData as any[]).map((mod) => {
      let levelId = "level-0";
      if (mod.id.startsWith("module-1")) levelId = "level-1";
      else if (mod.id.startsWith("module-2")) levelId = "level-2";
      else if (mod.id.startsWith("module-3")) levelId = "level-3";
      else if (mod.id.startsWith("module-4")) levelId = "level-4";
      else if (mod.id.startsWith("module-5")) levelId = "level-5";

      return {
        id: mod.id,
        levelId,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        topicIds: [],
      };
    });

    // Validate & Load Topics
    this.topics = (topicsData as unknown[]).map((top) => validateTopic(top));

    // Link topic IDs back to modules
    this.topics.forEach((top) => {
      const parentMod = this.modules.find((m) => m.id === top.moduleId);
      if (parentMod && !parentMod.topicIds.includes(top.id)) {
        parentMod.topicIds.push(top.id);
      }
    });

    // Validate & Load Concepts, Skills, Misconceptions
    this.concepts = (conceptsData as unknown[]).map((c) => validateConcept(c));
    this.skills = (skillsData as unknown[]).map((s) => validateSkill(s));
    this.misconceptions = (misconceptionsData as unknown[]).map((m) => validateMisconception(m));

    // Load & Validate Golden Lessons
    const rawGoldenLessons = [
      lessonWhatIsFrontend,
      lessonElementsTags,
      lessonCssFlexbox,
      lessonJsFunctions,
      lessonFixBrokenPage,
    ];

    rawGoldenLessons.forEach((raw) => {
      const validated = validateLesson(raw as unknown);
      this.goldenLessons.set(validated.id, validated);
    });

    // Index Legacy Lessons
    (legacyLessonsData as unknown as LegacyLesson[]).forEach((les) => {
      this.legacyLessons.set(les.id, les);
    });
  }

  public getAcademy(): Academy {
    return this.academy;
  }

  public getLevels(): CanonicalLevel[] {
    return this.levels;
  }

  public getLevel(id: string): CanonicalLevel | undefined {
    return this.levels.find((l) => l.id === id);
  }

  public getModules(): CanonicalModule[] {
    return this.modules;
  }

  public getModule(id: string): CanonicalModule | undefined {
    return this.modules.find((m) => m.id === id);
  }

  public getTopics(): CanonicalTopic[] {
    return this.topics;
  }

  public getTopic(id: string): CanonicalTopic | undefined {
    return this.topics.find((t) => t.id === id);
  }

  public getConcepts(): Concept[] {
    return this.concepts;
  }

  public getConcept(id: string): Concept | undefined {
    return this.concepts.find((c) => c.id === id);
  }

  public getSkills(): Skill[] {
    return this.skills;
  }

  public getSkill(id: string): Skill | undefined {
    return this.skills.find((s) => s.id === id);
  }

  public getMisconceptions(): Misconception[] {
    return this.misconceptions;
  }

  public getMisconception(id: string): Misconception | undefined {
    return this.misconceptions.find((m) => m.id === id);
  }

  public getGoldenLessons(): CanonicalLesson[] {
    return Array.from(this.goldenLessons.values());
  }

  public getCanonicalLesson(id: string): CanonicalLesson | undefined {
    return this.goldenLessons.get(id);
  }

  /**
   * Retrieves a lesson by ID, preferring canonical golden fixtures
   * and dynamically adapting legacy lessons when needed.
   */
  public getLesson(id: string): CanonicalLesson | undefined {
    if (this.goldenLessons.has(id)) {
      return this.goldenLessons.get(id);
    }

    const legacy = this.legacyLessons.get(id);
    if (legacy) {
      return adaptLegacyLessonToCanonical(legacy);
    }

    return undefined;
  }

  public getLessonsForTopic(topicId: string): CanonicalLesson[] {
    const canonicals = Array.from(this.goldenLessons.values()).filter((l) => l.topicId === topicId);
    if (canonicals.length > 0) return canonicals;

    const legacyList = Array.from(this.legacyLessons.values())
      .filter((l) => l.topicId === topicId)
      .map((l) => adaptLegacyLessonToCanonical(l));

    return legacyList;
  }

  public getLessonsForModule(moduleId: string): CanonicalLesson[] {
    const list = Array.from(this.legacyLessons.values())
      .filter((l) => l.moduleId === moduleId)
      .map((l) => {
        if (this.goldenLessons.has(l.id)) {
          return this.goldenLessons.get(l.id)!;
        }
        return adaptLegacyLessonToCanonical(l);
      });

    return list;
  }

  public getNextLesson(lessonId: string): CanonicalLesson | null {
    const current = this.legacyLessons.get(lessonId);
    if (current && current.nextLessonId) {
      return this.getLesson(current.nextLessonId) || null;
    }
    return null;
  }

  public getPreviousLesson(lessonId: string): CanonicalLesson | null {
    const current = this.legacyLessons.get(lessonId);
    if (current && current.previousLessonId) {
      return this.getLesson(current.previousLessonId) || null;
    }
    return null;
  }

  public validateAllContent(): CurriculumIntegrityReport {
    return validateCurriculumIntegrity({
      academy: this.academy,
      levels: this.levels,
      modules: this.modules,
      topics: this.topics,
      concepts: this.concepts,
      skills: this.skills,
      misconceptions: this.misconceptions,
      lessons: Array.from(this.goldenLessons.values()),
    });
  }
}

export const canonicalProvider = new CanonicalProvider();
