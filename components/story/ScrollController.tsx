"use client";

import { useEffect } from "react";
import { STORY_SECTIONS, type SectionId } from "@/lib/constants";
import {
  useSetActiveSection,
  useSetReducedMotion,
  useSetScrollProgress,
} from "@/lib/scroll-store";

export default function ScrollController() {
  const setActiveSection = useSetActiveSection();
  const setReducedMotion = useSetReducedMotion();
  const setScrollProgress = useSetScrollProgress();

  useEffect(() => {
    let frame = 0;
    let currentSection: SectionId = "intro";

    const updateScrollState = () => {
      frame = 0;

      const scrollRoot = document.documentElement;
      const maxScroll = Math.max(1, scrollRoot.scrollHeight - window.innerHeight);
      const scrollY = window.scrollY;
      const viewportCenter = scrollY + window.innerHeight * 0.5;

      setScrollProgress(scrollY / maxScroll);

      let activeSection = currentSection;
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const section of STORY_SECTIONS) {
        const element = document.getElementById(section.id);

        if (!element) {
          continue;
        }

        const sectionCenter = element.offsetTop + element.offsetHeight * 0.5;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          activeSection = section.id;
        }
      }

      if (activeSection !== currentSection) {
        currentSection = activeSection;
        setActiveSection(activeSection);
      }
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [setActiveSection, setScrollProgress]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const updateReducedMotion = () => {
      setReducedMotion(reducedMotionQuery.matches);
    };

    updateReducedMotion();
    reducedMotionQuery.addEventListener("change", updateReducedMotion);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateReducedMotion);
    };
  }, [setReducedMotion]);

  return null;
}
