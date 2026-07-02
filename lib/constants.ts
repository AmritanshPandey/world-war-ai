export const STORY_SECTIONS = [
  {
    id: "intro",
    label: "Intro",
    title: "World War AI",
  },
  {
    id: "outbreak",
    label: "Outbreak",
    title: "The Outbreak",
  },
  {
    id: "observer",
    label: "Observer",
    title: "The Observer",
  },
  {
    id: "pattern",
    label: "Pattern",
    title: "The Pattern",
  },
  {
    id: "act-two",
    label: "Act 2",
    title: "Act Two Placeholder",
  },
  {
    id: "manifesto",
    label: "Manifesto",
    title: "Final Manifesto Placeholder",
  },
] as const;

export type SectionId = (typeof STORY_SECTIONS)[number]["id"];
