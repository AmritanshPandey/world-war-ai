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
    id: "wall",
    label: "Wall",
    title: "The Wall",
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
    id: "hypothesis",
    label: "Hypothesis",
    title: "Test the Hypothesis",
  },
  {
    id: "protocol",
    label: "Protocol",
    title: "Survival Protocol",
  },
  {
    id: "clarity",
    label: "Clarity",
    title: "Clarity After Chaos",
  },
  {
    id: "manifesto",
    label: "Manifesto",
    title: "Final Manifesto",
  },
] as const;

export type SectionId = (typeof STORY_SECTIONS)[number]["id"];
