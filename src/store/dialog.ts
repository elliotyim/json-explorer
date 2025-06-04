import { create } from 'zustand'

interface DialogState {
  dialog: DialogProps
  setDialog: (dialog: DialogProps) => void
}

export const useDialogStore = create<DialogState>((set) => ({
  dialog: { open: false },
  setDialog: (dialog) => set({ dialog }),
}))
