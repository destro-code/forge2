import { create } from "@/lib/mini-store";

export const commandPaletteStore = create({ open: false });

export function useCommandPalette() {
  const [state, set] = commandPaletteStore.useStore();
  return {
    open: state.open,
    setOpen: (o: boolean) => set({ open: o }),
    toggle: () => set({ open: !state.open }),
  };
}
