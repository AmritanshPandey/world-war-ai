import { STORY_SECTIONS } from "@/lib/constants";

export default function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/45 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#intro" className="cinematic-text text-sm text-white">
          World War AI
        </a>

        <nav
          aria-label="Primary sections"
          className="hidden items-center gap-5 text-xs text-white/58 md:flex"
        >
          {STORY_SECTIONS.slice(1, 4).map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="transition-colors hover:text-white"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="thin-hud-border px-3 py-1 text-[11px] font-medium text-hud">
          Foundation v0
        </div>
      </div>
    </header>
  );
}
