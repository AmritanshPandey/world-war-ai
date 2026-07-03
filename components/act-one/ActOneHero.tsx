import HeroTitleFade from "@/components/act-one/HeroTitleFade";
import ParallaxScene from "@/components/act-one/ParallaxScene";
import ZombieSwarmScene from "@/components/webgl/swarm/ZombieSwarmScene";

export default function ActOneHero() {
  return (
    <section id="intro" data-hero-pin className="story-slide relative h-[280vh]">
      <div className="grain-overlay sticky top-0 flex h-svh items-center overflow-hidden bg-[#0a0908] px-5 py-24 md:px-10">
        <ParallaxScene />
        <ZombieSwarmScene />

        <div className="relative z-20 mx-auto flex w-full max-w-7xl items-center">
          <HeroTitleFade>
            <div className="max-w-5xl pt-10">
              <h1 className="title-display relative mt-6 inline-block py-[1.1em] leading-none text-[#f2efe6]">
                <span
                  aria-hidden="true"
                  className="title-grunge pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[clamp(9rem,34vw,19rem)] font-black leading-none text-[#d3170c]"
                >
                  AI
                </span>
                <span className="relative z-10 block whitespace-nowrap text-[clamp(2rem,7vw,4.6rem)] font-bold tracking-[0.16em] [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                  WORLD WAR
                </span>
                <span className="sr-only">AI</span>
              </h1>
              <p className="relative z-10 mt-16 max-w-xl text-lg leading-8 text-white/75 md:text-2xl md:leading-9">
                A Designer&apos;s Survival Playbook for the Age of Infinite
                Generation
              </p>
            </div>
          </HeroTitleFade>
        </div>
      </div>
    </section>
  );
}
