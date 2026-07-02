const fallingBodies = [
  { left: "43%", top: "23%", size: 15, rotate: -64, opacity: 0.76 },
  { left: "45.5%", top: "27%", size: 13, rotate: 38, opacity: 0.84 },
  { left: "47.4%", top: "22.5%", size: 16, rotate: -18, opacity: 0.72 },
  { left: "49.6%", top: "31%", size: 18, rotate: 72, opacity: 0.86 },
  { left: "51.2%", top: "26.5%", size: 12, rotate: -92, opacity: 0.66 },
  { left: "52.5%", top: "34%", size: 15, rotate: 18, opacity: 0.78 },
  { left: "54.8%", top: "28%", size: 18, rotate: -42, opacity: 0.88 },
  { left: "56.1%", top: "37%", size: 13, rotate: 104, opacity: 0.7 },
  { left: "58.2%", top: "32%", size: 17, rotate: -12, opacity: 0.82 },
  { left: "60.2%", top: "26%", size: 12, rotate: 54, opacity: 0.66 },
  { left: "61.8%", top: "39%", size: 15, rotate: -78, opacity: 0.74 },
  { left: "64%", top: "34.5%", size: 13, rotate: 28, opacity: 0.78 },
];

const towerBodies = Array.from({ length: 72 }, (_, index) => {
  const row = index % 18;
  const column = Math.floor(index / 18);
  const left = 18 + row * 3.8 + Math.sin(index * 1.7) * 3.2;
  const top = 7 + column * 19 + ((index * 11) % 17);
  const edgePull = Math.max(0, Math.abs(left - 50) - 21) * 0.7;

  return {
    left: `${left + edgePull}%`,
    top: `${top}%`,
    size: 7 + ((index * 5) % 9),
    rotate: -52 + ((index * 37) % 126),
    opacity: 0.46 + ((index * 13) % 28) / 100,
  };
});

const ridgeBodies = [
  { left: "4%", top: "49%", size: 14, rotate: -82, opacity: 0.84 },
  { left: "8%", top: "42%", size: 13, rotate: -32, opacity: 0.82 },
  { left: "12%", top: "35%", size: 12, rotate: 28, opacity: 0.78 },
  { left: "18%", top: "26%", size: 15, rotate: -12, opacity: 0.9 },
  { left: "24%", top: "18%", size: 13, rotate: 42, opacity: 0.86 },
  { left: "31%", top: "12%", size: 16, rotate: -52, opacity: 0.92 },
  { left: "38%", top: "8%", size: 12, rotate: 18, opacity: 0.84 },
  { left: "46%", top: "5%", size: 14, rotate: -28, opacity: 0.9 },
  { left: "55%", top: "7%", size: 12, rotate: 54, opacity: 0.78 },
  { left: "64%", top: "12%", size: 15, rotate: -18, opacity: 0.88 },
  { left: "73%", top: "19%", size: 13, rotate: 38, opacity: 0.8 },
  { left: "82%", top: "28%", size: 15, rotate: -44, opacity: 0.86 },
  { left: "91%", top: "39%", size: 12, rotate: 20, opacity: 0.76 },
];

function PersonSilhouette({
  className = "",
  left,
  top,
  size,
  rotate,
  opacity,
}: {
  className?: string;
  left: string;
  top: string;
  size: number;
  rotate: number;
  opacity: number;
}) {
  return (
    <span
      className={`swarm-person ${className}`}
      style={{
        left,
        top,
        width: `${size}px`,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
      }}
    />
  );
}

export default function ParallaxScene() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-[#efeee9]"
    >
      <div
        data-layer="poster-sky"
        className="absolute inset-0 bg-[radial-gradient(circle_at_62%_18%,rgba(255,255,255,0.98),rgba(255,255,255,0.74)_20%,transparent_46%),radial-gradient(circle_at_86%_20%,rgba(209,207,201,0.56),transparent_34%),linear-gradient(180deg,#f8f7f2_0%,#d9d7cf_58%,#201f1d_100%)]"
      />

      <div
        data-layer="smoke"
        className="absolute inset-0 opacity-85 mix-blend-multiply bg-[radial-gradient(ellipse_at_72%_60%,rgba(0,0,0,0.34),transparent_32%),radial-gradient(ellipse_at_58%_78%,rgba(0,0,0,0.24),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.04),transparent_36%,rgba(0,0,0,0.18)_100%)]"
      />

      <div
        data-layer="helicopter"
        className="absolute left-[52%] top-[12%] z-[3] h-[16vh] w-[76vw] min-w-0 -rotate-[8deg] opacity-95 md:left-[45%] md:top-[10%] md:h-[18vh] md:w-[34vw] md:min-w-80"
      >
        <div className="absolute left-[34%] top-[34%] h-[30%] w-[28%] rounded-[44%_50%_42%_38%] bg-black shadow-[0_12px_22px_rgba(0,0,0,0.36)]" />
        <div className="absolute left-[24%] top-[42%] h-[6%] w-[26%] origin-right -rotate-[17deg] bg-black [clip-path:polygon(0_24%,100%_0,100%_100%,0_70%)]" />
        <div className="absolute left-[17%] top-[36%] h-[16%] w-[10%] -rotate-[26deg] bg-black [clip-path:polygon(0_18%,100%_42%,84%_78%,10%_68%)]" />
        <div className="absolute left-[48%] top-[61%] h-[3%] w-[20%] bg-black" />
        <div className="absolute left-[47%] top-[65%] h-[3%] w-[14%] rotate-[10deg] bg-black" />
        <div className="absolute left-[43%] top-[25%] h-[3%] w-[56%] origin-left -rotate-[2deg] bg-black/18 blur-[3px]" />
        <div className="absolute left-[41%] top-[23%] h-[3%] w-[36%] origin-left rotate-[176deg] bg-black/20 blur-[2px]" />
        <div className="absolute left-[24%] top-[29%] h-[3%] w-[16%] origin-left rotate-[68deg] bg-black/20 blur-[2px]" />
        <div className="absolute left-[23%] top-[28%] h-[2%] w-[14%] origin-left -rotate-[112deg] bg-black/18 blur-[2px]" />
        <div className="absolute left-[43%] top-[28%] h-[12%] w-[2%] bg-black" />
      </div>

      <div
        data-layer="falling-bodies"
        className="absolute inset-0 z-[4] hidden md:block"
      >
        {fallingBodies.map((body, index) => (
          <PersonSilhouette
            key={`fall-${index}`}
            className="swarm-person--falling"
            {...body}
          />
        ))}
      </div>

      <div
        data-layer="swarm-tower"
        className="absolute bottom-[-5%] right-[-46%] z-[2] h-[74vh] w-[92vw] min-w-0 md:bottom-[-6%] md:right-[1%] md:h-[82vh] md:w-[43vw] md:min-w-[420px]"
      >
        <div className="swarm-column absolute inset-0" />
        <div className="absolute left-[24%] top-[27%] hidden h-[16%] w-[22%] -rotate-[24deg] rounded-sm bg-[linear-gradient(90deg,#121212,#71706b_44%,#10100f)] shadow-[0_16px_26px_rgba(0,0,0,0.5)] [clip-path:polygon(5%_8%,88%_0,100%_88%,18%_100%)] md:block">
          <div className="absolute left-[17%] top-[20%] h-[23%] w-[21%] bg-white/20" />
          <div className="absolute left-[50%] top-[18%] h-[26%] w-[22%] bg-white/16" />
          <div className="absolute left-[28%] top-[58%] h-[22%] w-[24%] bg-white/12" />
        </div>

        <div className="hidden md:block">
          {ridgeBodies.map((body, index) => (
            <PersonSilhouette
              key={`ridge-${index}`}
              className="swarm-person--ridge"
              {...body}
            />
          ))}

          {towerBodies.map((body, index) => (
            <PersonSilhouette
              key={`tower-${index}`}
              className="swarm-person--tower"
              {...body}
            />
          ))}
        </div>
      </div>

      <div
        data-layer="ground-swarm"
        className="absolute inset-x-[-8%] bottom-[-2%] z-[1] h-[22vh] bg-[radial-gradient(ellipse_at_68%_16%,rgba(0,0,0,0.62),transparent_38%),radial-gradient(ellipse_at_76%_34%,rgba(0,0,0,0.72),transparent_46%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.78)_64%,#020202_100%)] md:h-[24vh]"
      />

      <div
        data-layer="left-title-shadow"
        className="absolute inset-y-0 left-0 z-[5] w-[64%] bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.62)_45%,transparent_100%)] md:w-[58%]"
      />
    </div>
  );
}
