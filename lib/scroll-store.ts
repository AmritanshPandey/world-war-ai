"use client";

import { create } from "zustand";
import type { SectionId } from "@/lib/constants";

type ScrollState = {
  scrollProgress: number;
  activeSection: SectionId;
  reducedMotion: boolean;
  setScrollProgress: (scrollProgress: number) => void;
  setActiveSection: (activeSection: SectionId) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
};

export const useScrollStore = create<ScrollState>((set) => ({
  scrollProgress: 0,
  activeSection: "intro",
  reducedMotion: false,
  setScrollProgress: (scrollProgress) =>
    set({ scrollProgress: Math.min(Math.max(scrollProgress, 0), 1) }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));

export const useScrollProgress = () =>
  useScrollStore((state) => state.scrollProgress);

export const useActiveSection = () =>
  useScrollStore((state) => state.activeSection);

export const useReducedMotionPreference = () =>
  useScrollStore((state) => state.reducedMotion);

export const useSetScrollProgress = () =>
  useScrollStore((state) => state.setScrollProgress);

export const useSetActiveSection = () =>
  useScrollStore((state) => state.setActiveSection);

export const useSetReducedMotion = () =>
  useScrollStore((state) => state.setReducedMotion);
