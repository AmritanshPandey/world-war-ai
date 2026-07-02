import ActOneHero from "@/components/act-one/ActOneHero";
import SiteHeader from "@/components/layout/SiteHeader";
import LayeredScrollScene from "@/components/story/LayeredScrollScene";
import ProgressRail from "@/components/story/ProgressRail";
import ScrollController from "@/components/story/ScrollController";
import SceneSection from "@/components/story/SceneSection";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <ScrollController />
      <LayeredScrollScene />
      <SiteHeader />
      <ProgressRail />

      <div className="relative z-10">
        <ActOneHero />
        <SceneSection
          id="outbreak"
          eyebrow="Signal 02"
          title="The Outbreak"
          tone="crimson"
        >
          Infinite generation hits the creative floor before anyone has a map.
        </SceneSection>
        <SceneSection
          id="observer"
          eyebrow="Signal 03"
          title="The Observer"
          tone="green"
        >
          Designers stop reacting to the noise and start reading the system.
        </SceneSection>
        <SceneSection
          id="pattern"
          eyebrow="Signal 04"
          title="The Pattern"
          tone="amber"
        >
          Repetition becomes visible. Strategy begins where panic ends.
        </SceneSection>
        <SceneSection
          id="act-two"
          eyebrow="Next Protocol"
          title="Act Two Placeholder"
          tone="steel"
        >
          The next act will introduce the survival framework.
        </SceneSection>
        <SceneSection
          id="manifesto"
          eyebrow="Closing Transmission"
          title="Final Manifesto Placeholder"
          tone="crimson"
        >
          The final statement is reserved for the complete interactive build.
        </SceneSection>
      </div>
    </main>
  );
}
