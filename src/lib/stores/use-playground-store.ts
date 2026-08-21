import { create } from "zustand";
import type {
  PlaygroundFile,
  PlaygroundConsoleLog,
  PlaygroundProjectManifest,
  PlaygroundRuntime,
} from "@/lib/types/playground";
import type { ValidationReport } from "@/lib/types/validation";
import { resolveDefaultRuntime } from "@/lib/compiler/entry-resolver";

export interface PlaygroundStore {
  manifest: PlaygroundProjectManifest;
  activeFileId: string;
  openTabIds: string[];
  consoleLogs: PlaygroundConsoleLog[];
  isBuilding: boolean;
  compilerOutput: string;

  // Validation & Workspace State (Phase 2 Hardening)
  validationReport: ValidationReport | null;
  isValidating: boolean;
  workspaceRevision: number;

  // Authoritative Manifest Actions
  setManifest: (
    manifestOrUpdater:
      PlaygroundProjectManifest | ((prev: PlaygroundProjectManifest) => PlaygroundProjectManifest),
  ) => void;
  setRuntime: (runtime: PlaygroundRuntime) => void;
  setEntryFile: (entryFile?: string) => void;
  setFiles: (files: PlaygroundFile[]) => void;
  updateFileContent: (fileId: string, content: string) => void;
  addFile: (file: PlaygroundFile) => void;
  deleteFile: (fileId: string) => void;

  // Editor & UI State Actions
  setActiveFileId: (fileId: string) => void;
  openTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  setOpenTabIds: (ids: string[]) => void;

  // Execution & Diagnostics
  addConsoleLog: (log: Omit<PlaygroundConsoleLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
  setCompilerOutput: (output: string, isBuilding?: boolean) => void;
  setIsBuilding: (isBuilding: boolean) => void;
  setConsoleLogs: (
    logs: PlaygroundConsoleLog[] | ((prev: PlaygroundConsoleLog[]) => PlaygroundConsoleLog[]),
  ) => void;

  // Validation Actions (Phase 2)
  setValidationReport: (report: ValidationReport | null) => void;
  setIsValidating: (isValidating: boolean) => void;

  // Computed / Convenience Getter for files
  files: PlaygroundFile[];
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  manifest: {
    runtime: "react",
    files: [],
  },
  files: [],
  activeFileId: "",
  openTabIds: [],
  consoleLogs: [],
  isBuilding: false,
  compilerOutput: "",
  validationReport: null,
  isValidating: false,
  workspaceRevision: 0,

  setManifest: (manifestOrUpdater) =>
    set((state) => {
      const nextManifest =
        typeof manifestOrUpdater === "function"
          ? manifestOrUpdater(state.manifest)
          : manifestOrUpdater;
      return {
        manifest: nextManifest,
        files: nextManifest.files,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  setRuntime: (runtime) =>
    set((state) => {
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        runtime,
      };
      return {
        manifest: nextManifest,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  setEntryFile: (entryFile) =>
    set((state) => {
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        entryFile,
      };
      return {
        manifest: nextManifest,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  setFiles: (files) =>
    set((state) => {
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        runtime: state.manifest.runtime || resolveDefaultRuntime(files),
        files,
      };
      return {
        manifest: nextManifest,
        files,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  updateFileContent: (fileId, content) =>
    set((state) => {
      const nextFiles = state.manifest.files.map((f) =>
        f.id === fileId ? { ...f, code: content } : f,
      );
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        files: nextFiles,
      };
      return {
        manifest: nextManifest,
        files: nextFiles,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  addFile: (file) =>
    set((state) => {
      const nextFiles = [...state.manifest.files, file];
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        files: nextFiles,
      };
      const nextOpenTabs = state.openTabIds.includes(file.id)
        ? state.openTabIds
        : [...state.openTabIds, file.id];
      return {
        manifest: nextManifest,
        files: nextFiles,
        openTabIds: nextOpenTabs,
        activeFileId: file.id,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  deleteFile: (fileId) =>
    set((state) => {
      const nextFiles = state.manifest.files.filter((f) => f.id !== fileId);
      const nextOpenTabs = state.openTabIds.filter((id) => id !== fileId);
      let nextActiveFileId = state.activeFileId;
      if (state.activeFileId === fileId) {
        nextActiveFileId = nextFiles.length > 0 ? nextFiles[0].id : "";
      }
      const nextManifest: PlaygroundProjectManifest = {
        ...state.manifest,
        files: nextFiles,
      };
      return {
        manifest: nextManifest,
        files: nextFiles,
        openTabIds: nextOpenTabs,
        activeFileId: nextActiveFileId,
        workspaceRevision: state.workspaceRevision + 1,
        validationReport: null,
      };
    }),

  setActiveFileId: (fileId) => set({ activeFileId: fileId }),

  openTab: (fileId) =>
    set((state) => ({
      openTabIds: state.openTabIds.includes(fileId)
        ? state.openTabIds
        : [...state.openTabIds, fileId],
      activeFileId: fileId,
    })),

  closeTab: (fileId) =>
    set((state) => {
      const newOpenTabs = state.openTabIds.filter((id) => id !== fileId);
      let newActiveFileId = state.activeFileId;
      if (state.activeFileId === fileId && newOpenTabs.length > 0) {
        newActiveFileId = newOpenTabs[0];
      } else if (newOpenTabs.length === 0) {
        newActiveFileId = "";
      }
      return { openTabIds: newOpenTabs, activeFileId: newActiveFileId };
    }),

  addConsoleLog: (log) =>
    set((state) => ({
      consoleLogs: [
        ...state.consoleLogs,
        {
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    })),

  clearLogs: () => set({ consoleLogs: [] }),

  setCompilerOutput: (output, isBuilding) =>
    set((state) => ({
      compilerOutput: output,
      isBuilding: isBuilding !== undefined ? isBuilding : state.isBuilding,
    })),

  setOpenTabIds: (ids) => set({ openTabIds: ids }),

  setIsBuilding: (isBuilding) => set({ isBuilding }),

  setConsoleLogs: (updater) =>
    set((state) => ({
      consoleLogs: typeof updater === "function" ? updater(state.consoleLogs) : updater,
    })),

  setValidationReport: (report) => set({ validationReport: report }),
  setIsValidating: (isValidating) => set({ isValidating }),
}));
