import { create } from "zustand";
import type { PlaygroundFile, PlaygroundConsoleLog } from "@/lib/types/playground";

export interface PlaygroundStore {
  files: PlaygroundFile[];
  activeFileId: string;
  openTabIds: string[];
  consoleLogs: PlaygroundConsoleLog[];
  isBuilding: boolean;
  compilerOutput: string;
  compilerError: string | null;

  updateFileContent: (fileId: string, content: string) => void;
  setActiveFileId: (fileId: string) => void;
  openTab: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  addConsoleLog: (log: Omit<PlaygroundConsoleLog, "id" | "timestamp">) => void;
  clearLogs: () => void;
  setCompilerOutput: (output: string, error?: string | null, isBuilding?: boolean) => void;
  setFiles: (files: PlaygroundFile[]) => void;
  setOpenTabIds: (ids: string[]) => void;
  setIsBuilding: (isBuilding: boolean) => void;
  setConsoleLogs: (
    logs: PlaygroundConsoleLog[] | ((prev: PlaygroundConsoleLog[]) => PlaygroundConsoleLog[]),
  ) => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  files: [],
  activeFileId: "",
  openTabIds: [],
  consoleLogs: [],
  isBuilding: false,
  compilerOutput: "",
  compilerError: null,

  updateFileContent: (fileId, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === fileId ? { ...f, code: content } : f)),
    })),
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
  setCompilerOutput: (output, error = null, isBuilding) =>
    set((state) => ({
      compilerOutput: output,
      compilerError: error,
      isBuilding: isBuilding !== undefined ? isBuilding : state.isBuilding,
    })),
  setFiles: (files) => set({ files }),
  setOpenTabIds: (ids) => set({ openTabIds: ids }),
  setIsBuilding: (isBuilding) => set({ isBuilding }),
  setConsoleLogs: (updater) =>
    set((state) => ({
      consoleLogs: typeof updater === "function" ? updater(state.consoleLogs) : updater,
    })),
}));
