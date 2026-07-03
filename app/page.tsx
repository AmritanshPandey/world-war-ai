import ActOneHero from "@/components/act-one/ActOneHero";
import ClarityChapter from "@/components/chapters/ClarityChapter";
import HypothesisChapter from "@/components/chapters/HypothesisChapter";
import ManifestoChapter from "@/components/chapters/ManifestoChapter";
import MechanismChapter from "@/components/chapters/MechanismChapter";
import ObserverChapter from "@/components/chapters/ObserverChapter";
import OutbreakChapter from "@/components/chapters/OutbreakChapter";
import PatternChapter from "@/components/chapters/PatternChapter";
import ProtocolChapter from "@/components/chapters/ProtocolChapter";
import WallChapter from "@/components/chapters/WallChapter";
import LayeredScrollScene from "@/components/story/LayeredScrollScene";
import ScrollController from "@/components/story/ScrollController";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-black text-white">
      <ScrollController />
      <LayeredScrollScene />

      <div className="relative z-10">
        <ActOneHero />
        <OutbreakChapter />
        <WallChapter />
        <MechanismChapter />
        <ObserverChapter />
        <PatternChapter />
        <HypothesisChapter />
        <ProtocolChapter />
        <ClarityChapter />
        <ManifestoChapter />
      </div>
    </main>
  );
}
