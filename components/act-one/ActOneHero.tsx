import ParallaxScene from "@/components/act-one/ParallaxScene";
import ScrollIndicator from "@/components/ui/ScrollIndicator";
import WebGLOverlay from "@/components/webgl/WebGLOverlay";

export default function ActOneHero() {
  return (
    <section
      id="intro"
      className="vignette-overlay grain-overlay relative flex min-h-svh overflow-hidden bg-black px-5 py-28 md:px-10"
    >
      <ParallaxScene />
      <WebGLOverlay
        origin={[1.42, -1.96, 0]}
        mobileOrigin={[0.34, -1.98, 0]}
        spread={[1.78, 0.42, 1.08]}
        desktopCount={260}
        mobileCount={90}
        heroSparkCount={32}
        intensity={0.52}
        windStrength={0.34}
        opacity={0.42}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.48)_42%,rgba(0,0,0,0.14)_100%)]"
      />

      <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center">
        <div className="max-w-5xl pt-12">
          <p className="cinematic-text text-xs text-hud md:text-sm">
            ACT 1 / OBSERVE THE CHAOS
          </p>
          <h1 className="mt-6 max-w-5xl text-5xl font-black leading-none text-white sm:text-7xl lg:text-8xl">
            WORLD WAR AI
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 md:text-2xl md:leading-9">
            A Designer&apos;s Survival Playbook for the Age of Infinite
            Generation
          </p>
          <div className="mt-10">
            <ScrollIndicator href="#outbreak" label="Begin the briefing" />
          </div>
        </div>
      </div>
    </section>
  );
}
