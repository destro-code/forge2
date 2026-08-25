import academyData from "../../data/canonical/academy.json";
import levelsData from "../../data/canonical/levels.json";
import conceptsData from "../../data/canonical/concepts.json";
import skillsData from "../../data/canonical/skills.json";
import misconceptionsData from "../../data/canonical/misconceptions.json";
import topicsData from "../../data/canonical/topics.json";
import legacyTopicsData from "../../data/topics.json";

import lessonWhatIsFrontend from "../../data/canonical/lessons/lesson-what-is-frontend-development.json";
import lessonElementsTags from "../../data/canonical/lessons/lesson-elements-tags-attributes.json";
import lessonCssFlexbox from "../../data/canonical/lessons/lesson-css-flexbox.json";
import lessonJsFunctions from "../../data/canonical/lessons/lesson-javascript-functions.json";
import lessonFixBrokenPage from "../../data/canonical/lessons/lesson-fix-the-broken-page.json";
import lessonUnderstandingNetworkRequests from "../../data/canonical/lessons/lesson-understanding-network-requests.json";

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
  ContentProvider,
  EntityReference,
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

export class ContentValidationError extends Error {
  constructor(
    message: string,
    public errors?: any,
  ) {
    super(message);
    this.name = "ContentValidationError";
  }
}

export class ContentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentNotFoundError";
  }
}

export class ContentIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentIntegrityError";
  }
}

export class CanonicalProvider implements ContentProvider {
  private academy!: Academy;
  private levels: CanonicalLevel[] = [];
  private modules: CanonicalModule[] = [];
  private topics: CanonicalTopic[] = [];
  private concepts: Concept[] = [];
  private skills: Skill[] = [];
  private misconceptions: Misconception[] = [];
  private lessons: CanonicalLesson[] = [];

  // Index maps by ID
  private levelsById = new Map<string, CanonicalLevel>();
  private modulesById = new Map<string, CanonicalModule>();
  private topicsById = new Map<string, CanonicalTopic>();
  private conceptsById = new Map<string, Concept>();
  private skillsById = new Map<string, Skill>();
  private misconceptionsById = new Map<string, Misconception>();
  private lessonsById = new Map<string, CanonicalLesson>();

  // Relationship indexes
  private modulesByLevel = new Map<string, CanonicalModule[]>();
  private topicsByModule = new Map<string, CanonicalTopic[]>();
  private lessonsByTopic = new Map<string, CanonicalLesson[]>();
  private conceptsByTopic = new Map<string, Concept[]>();
  private skillsByTopic = new Map<string, Skill[]>();
  private lessonsByPrerequisite = new Map<string, CanonicalLesson[]>();

  // Globally sorted flat array of all lessons (curriculum order)
  private orderedLessons: CanonicalLesson[] = [];

  constructor() {
    this.initializeAndValidate();
  }

  private initializeAndValidate() {
    try {
      const idSet = new Set<string>();

      const checkAndRegisterId = (id: string, type: string) => {
        if (idSet.has(id)) {
          throw new ContentIntegrityError(`Duplicate ID detected: "${id}" in ${type}`);
        }
        idSet.add(id);
      };

      // 1. Validate & Load Academy
      try {
        this.academy = validateAcademy(academyData as unknown);
      } catch (err: any) {
        throw new ContentValidationError("Academy validation failed", err);
      }

      // 2. Validate & Load Levels
      try {
        this.levels = (levelsData as unknown[]).map((lvl) => {
          const validated = validateLevel(lvl);
          checkAndRegisterId(validated.id, "CanonicalLevel");
          this.levelsById.set(validated.id, validated);
          return validated;
        });
        // Sort levels by order
        this.levels.sort((a, b) => a.order - b.order);
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Levels validation failed", err);
      }

      // 3. Derive Canonical Modules from modules.json + levels
      try {
        this.modules = (legacyModulesData as any[]).map((mod) => {
          let levelId = "level-0";
          if (mod.id.startsWith("module-1")) levelId = "level-1";
          else if (mod.id.startsWith("module-2")) levelId = "level-2";
          else if (mod.id.startsWith("module-3")) levelId = "level-3";
          else if (mod.id.startsWith("module-4")) levelId = "level-4";
          else if (mod.id.startsWith("module-5")) levelId = "level-5";

          const canonicalMod: CanonicalModule = {
            id: mod.id,
            levelId,
            title: mod.title,
            description: mod.description,
            order: mod.order,
            topicIds: [],
          };

          checkAndRegisterId(canonicalMod.id, "CanonicalModule");
          this.modulesById.set(canonicalMod.id, canonicalMod);
          return canonicalMod;
        });
        // Sort modules by order
        this.modules.sort((a, b) => a.order - b.order);
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Modules validation failed", err);
      }

      // 4. Validate & Load Topics
      try {
        const adaptedLegacyTopics = (legacyTopicsData as any[]).map((lt) => ({
          id: lt.id,
          moduleId: lt.moduleId,
          title: lt.title,
          description: lt.description,
          order: lt.order,
          conceptIds: [],
          skillIds: [],
          lessonIds: [],
        }));
        const canonicalTopicIds = new Set((topicsData as any[]).map((t) => t.id));
        const allTopics = [
          ...(topicsData as unknown[]),
          ...adaptedLegacyTopics.filter((t) => !canonicalTopicIds.has(t.id)),
        ];
        this.topics = allTopics.map((top) => {
          const validated = validateTopic(top);
          checkAndRegisterId(validated.id, "CanonicalTopic");
          this.topicsById.set(validated.id, validated);
          return validated;
        });
        // Sort topics by order
        this.topics.sort((a, b) => a.order - b.order);
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Topics validation failed", err);
      }

      // Link topic IDs back to modules
      this.topics.forEach((top) => {
        const parentMod = this.modulesById.get(top.moduleId);
        if (parentMod && !parentMod.topicIds.includes(top.id)) {
          parentMod.topicIds.push(top.id);
        }
      });

      // 5. Validate & Load Concepts, Skills, Misconceptions
      try {
        this.concepts = (conceptsData as unknown[]).map((c) => {
          const validated = validateConcept(c);
          checkAndRegisterId(validated.id, "Concept");
          this.conceptsById.set(validated.id, validated);
          return validated;
        });
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Concepts validation failed", err);
      }

      try {
        this.skills = (skillsData as unknown[]).map((s) => {
          const validated = validateSkill(s);
          checkAndRegisterId(validated.id, "Skill");
          this.skillsById.set(validated.id, validated);
          return validated;
        });
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Skills validation failed", err);
      }

      try {
        this.misconceptions = (misconceptionsData as unknown[]).map((m) => {
          const validated = validateMisconception(m);
          checkAndRegisterId(validated.id, "Misconception");
          this.misconceptionsById.set(validated.id, validated);
          return validated;
        });
      } catch (err: any) {
        if (err instanceof ContentIntegrityError) throw err;
        throw new ContentValidationError("Misconceptions validation failed", err);
      }

      // 6. Validate & Load Lessons (First Golden, then Legacy)
      const rawGoldenLessons = [
        lessonWhatIsFrontend,
        lessonElementsTags,
        lessonCssFlexbox,
        lessonJsFunctions,
        lessonFixBrokenPage,
        lessonUnderstandingNetworkRequests,
      ];

      rawGoldenLessons.forEach((raw) => {
        try {
          const validated = validateLesson(raw as unknown);
          checkAndRegisterId(validated.id, "CanonicalLesson (Golden)");
          this.lessonsById.set(validated.id, validated);
          this.lessons.push(validated);
        } catch (err: any) {
          if (err instanceof ContentIntegrityError) throw err;
          const details = err?.errors ? JSON.stringify(err.errors) : err?.message || String(err);
          throw new ContentValidationError(
            `Golden lesson validation failed for: ${(raw as any).id} — ${details}`,
            err,
          );
        }
      });

      (legacyLessonsData as unknown as LegacyLesson[]).forEach((legacy) => {
        if (this.lessonsById.has(legacy.id)) {
          return; // Golden lesson takes precedence
        }
        try {
          const canonical = adaptLegacyLessonToCanonical(legacy);
          const validated = validateLesson(canonical);
          checkAndRegisterId(validated.id, "CanonicalLesson (Legacy)");
          this.lessonsById.set(validated.id, validated);
          this.lessons.push(validated);
        } catch (err: any) {
          if (err instanceof ContentIntegrityError) throw err;
          throw new ContentValidationError(
            `Legacy lesson validation failed for: ${legacy.id}`,
            err,
          );
        }
      });

      // Ensure all lessons reference a registered topic (synthesize fallback topics for legacy lessons if needed)
      this.lessons.forEach((les) => {
        if (!this.topicsById.has(les.topicId)) {
          const formattedTitle = les.topicId
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const match = les.id.match(/^lesson-(\d+-\d+)/);
          let derivedModuleId =
            (les as any).moduleId || (match ? `module-${match[1]}` : "module-0-1");
          if (!this.modulesById.has(derivedModuleId)) {
            if (derivedModuleId.startsWith("module-1-5")) derivedModuleId = "module-0-2";
            else if (this.modulesById.has("module-0-1")) derivedModuleId = "module-0-1";
            else derivedModuleId = this.modules[0]?.id || "module-0-1";
          }
          const fallbackTopic: CanonicalTopic = {
            id: les.topicId,
            moduleId: derivedModuleId,
            title: formattedTitle,
            description: `Topic for ${formattedTitle}`,
            order: 99,
            conceptIds: [],
            skillIds: [],
            lessonIds: [],
          };
          checkAndRegisterId(fallbackTopic.id, "CanonicalTopic (Synthesized)");
          this.topicsById.set(fallbackTopic.id, fallbackTopic);
          this.topics.push(fallbackTopic);
          const parentMod = this.modulesById.get(fallbackTopic.moduleId);
          if (parentMod && !parentMod.topicIds.includes(fallbackTopic.id)) {
            parentMod.topicIds.push(fallbackTopic.id);
          }
        }
      });

      // 7. Enforce Referential Integrity
      const integrityReport = validateCurriculumIntegrity({
        academy: this.academy,
        levels: this.levels,
        modules: this.modules,
        topics: this.topics,
        concepts: this.concepts,
        skills: this.skills,
        misconceptions: this.misconceptions,
        lessons: this.lessons,
      });

      if (!integrityReport.valid) {
        throw new ContentIntegrityError(
          `Curriculum relational integrity validation failed:\n` +
            integrityReport.errors.join("\n"),
        );
      }

      // 8. Build Maps and Secondary/Relationship Indexes
      // modulesByLevel
      this.modules.forEach((mod) => {
        const list = this.modulesByLevel.get(mod.levelId) || [];
        list.push(mod);
        this.modulesByLevel.set(mod.levelId, list);
      });
      // Sort each level's modules by order
      this.modulesByLevel.forEach((list) => list.sort((a, b) => a.order - b.order));

      // topicsByModule
      this.topics.forEach((top) => {
        const list = this.topicsByModule.get(top.moduleId) || [];
        list.push(top);
        this.topicsByModule.set(top.moduleId, list);
      });
      // Sort each module's topics by order
      this.topicsByModule.forEach((list) => list.sort((a, b) => a.order - b.order));

      // lessonsByTopic & lessonsByPrerequisite
      this.lessons.forEach((les) => {
        const list = this.lessonsByTopic.get(les.topicId) || [];
        list.push(les);
        this.lessonsByTopic.set(les.topicId, list);

        if (les.prerequisites.lessonIds) {
          les.prerequisites.lessonIds.forEach((prereqId) => {
            const prereqList = this.lessonsByPrerequisite.get(prereqId) || [];
            prereqList.push(les);
            this.lessonsByPrerequisite.set(prereqId, prereqList);
          });
        }
      });

      // Sort lessons inside each topic based on the topic's lessonIds sequence
      this.lessonsByTopic.forEach((list, topicId) => {
        const topic = this.topicsById.get(topicId);
        if (topic) {
          list.sort((a, b) => {
            const indexA = topic.lessonIds.indexOf(a.id);
            const indexB = topic.lessonIds.indexOf(b.id);
            if (indexA === -1 && indexB === -1) {
              const orderA = (a.metadata?.order as number) || 0;
              const orderB = (b.metadata?.order as number) || 0;
              return orderA - orderB;
            }
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        }
      });

      // conceptsByTopic & skillsByTopic
      this.concepts.forEach((con) => {
        const list = this.conceptsByTopic.get(con.topicId) || [];
        list.push(con);
        this.conceptsByTopic.set(con.topicId, list);
      });

      this.skills.forEach((sk) => {
        const list = this.skillsByTopic.get(sk.topicId) || [];
        list.push(sk);
        this.skillsByTopic.set(sk.topicId, list);
      });

      // 9. Build global sequential order (curriculum order traversal)
      this.orderedLessons = [];
      this.levels.forEach((lvl) => {
        const lvlModules = this.modulesByLevel.get(lvl.id) || [];
        lvlModules.forEach((mod) => {
          const modTopics = this.topicsByModule.get(mod.id) || [];
          modTopics.forEach((top) => {
            const topLessons = this.lessonsByTopic.get(top.id) || [];
            this.orderedLessons.push(...topLessons);
          });
        });
      });
    } catch (err: any) {
      if (err instanceof ContentValidationError || err instanceof ContentIntegrityError) {
        throw err;
      }
      throw new ContentIntegrityError(
        `Unexpected error during curriculum provider initialization: ${err.message}`,
      );
    }
  }

  // ContentProvider API implementation

  public getAcademy(): Academy {
    return this.academy;
  }

  public getLevels(): CanonicalLevel[] {
    return this.levels;
  }

  public getLevel(id: string): CanonicalLevel | undefined {
    return this.levelsById.get(id);
  }

  public getModules(): CanonicalModule[] {
    return this.modules;
  }

  public getModule(id: string): CanonicalModule | undefined {
    return this.modulesById.get(id);
  }

  public getTopics(): CanonicalTopic[] {
    return this.topics;
  }

  public getTopic(id: string): CanonicalTopic | undefined {
    return this.topicsById.get(id);
  }

  public getConcepts(): Concept[] {
    return this.concepts;
  }

  public getConcept(id: string): Concept | undefined {
    return this.conceptsById.get(id);
  }

  public getSkills(): Skill[] {
    return this.skills;
  }

  public getSkill(id: string): Skill | undefined {
    return this.skillsById.get(id);
  }

  public getMisconceptions(): Misconception[] {
    return this.misconceptions;
  }

  public getMisconception(id: string): Misconception | undefined {
    return this.misconceptionsById.get(id);
  }

  public getLessons(): CanonicalLesson[] {
    return this.orderedLessons;
  }

  public getLesson(id: string): CanonicalLesson | undefined {
    return this.lessonsById.get(id);
  }

  public getLessonsForTopic(topicId: string): CanonicalLesson[] {
    return this.lessonsByTopic.get(topicId) || [];
  }

  public getLessonsForModule(moduleId: string): CanonicalLesson[] {
    const topics = this.topicsByModule.get(moduleId) || [];
    const list: CanonicalLesson[] = [];
    topics.forEach((top) => {
      list.push(...this.getLessonsForTopic(top.id));
    });
    return list;
  }

  public getConceptsForTopic(topicId: string): Concept[] {
    return this.conceptsByTopic.get(topicId) || [];
  }

  public getSkillsForTopic(topicId: string): Skill[] {
    return this.skillsByTopic.get(topicId) || [];
  }

  public getPrerequisites(id: string): EntityReference[] {
    const refs: EntityReference[] = [];

    // Check if it's a lesson
    const lesson = this.lessonsById.get(id);
    if (lesson) {
      if (lesson.prerequisites.lessonIds) {
        lesson.prerequisites.lessonIds.forEach((pid) => refs.push({ type: "lesson", id: pid }));
      }
      if (lesson.prerequisites.conceptIds) {
        lesson.prerequisites.conceptIds.forEach((pid) => refs.push({ type: "concept", id: pid }));
      }
      if (lesson.prerequisites.skillIds) {
        lesson.prerequisites.skillIds.forEach((pid) => refs.push({ type: "skill", id: pid }));
      }
      return refs;
    }

    // Check if it's a concept
    const concept = this.conceptsById.get(id);
    if (concept) {
      if (concept.prerequisiteConceptIds) {
        concept.prerequisiteConceptIds.forEach((pid) => refs.push({ type: "concept", id: pid }));
      }
      return refs;
    }

    // Check if it's a skill
    const skill = this.skillsById.get(id);
    if (skill) {
      if (skill.prerequisiteSkillIds) {
        skill.prerequisiteSkillIds.forEach((pid) => refs.push({ type: "skill", id: pid }));
      }
      return refs;
    }

    return refs;
  }

  public getNextLesson(id: string): CanonicalLesson | undefined {
    const index = this.orderedLessons.findIndex((l) => l.id === id);
    if (index !== -1 && index < this.orderedLessons.length - 1) {
      return this.orderedLessons[index + 1];
    }
    return undefined;
  }

  public getPreviousLesson(id: string): CanonicalLesson | undefined {
    const index = this.orderedLessons.findIndex((l) => l.id === id);
    if (index > 0) {
      return this.orderedLessons[index - 1];
    }
    return undefined;
  }

  // Compatibility/Utility helpers
  public getGoldenLessons(): CanonicalLesson[] {
    return this.lessons.filter((l) => {
      return [
        "lesson-0-1-1",
        "lesson-1-1-2",
        "lesson-1-2-7",
        "lesson-1-3-1",
        "lesson-0-2-5",
      ].includes(l.id);
    });
  }

  public getCanonicalLesson(id: string): CanonicalLesson | undefined {
    const lesson = this.lessonsById.get(id);
    if (
      lesson &&
      ["lesson-0-1-1", "lesson-1-1-2", "lesson-1-2-7", "lesson-1-3-1", "lesson-0-2-5"].includes(id)
    ) {
      return lesson;
    }
    return undefined;
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
      lessons: this.lessons,
    });
  }
}

export const canonicalProvider = new CanonicalProvider();
