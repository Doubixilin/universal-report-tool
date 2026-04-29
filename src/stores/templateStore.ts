import { create } from "zustand";
import { Template } from "@/types";

interface TemplateState {
  templates: Template[];
  currentTemplate: Template | null;
  setTemplates: (templates: Template[]) => void;
  setCurrentTemplate: (template: Template | null) => void;
  addTemplate: (template: Template) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (template: Template) => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  currentTemplate: null,
  setTemplates: (templates) => set({ templates }),
  setCurrentTemplate: (template) => set({ currentTemplate: template }),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
      currentTemplate: state.currentTemplate?.id === id ? null : state.currentTemplate,
    })),
  updateTemplate: (template) =>
    set((state) => ({
      templates: state.templates.map((t) => (t.id === template.id ? template : t)),
    })),
}));
