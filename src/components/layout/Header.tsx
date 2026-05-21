import { Info, Plus, Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

type HeaderProps = {
  onHome: () => void;
  onAbout: () => void;
  onNewMatrix: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
};

export const Header = ({ onHome, onAbout, onNewMatrix, saveStatus = "idle" }: HeaderProps) => (
  <header className="sticky top-0 z-30 border-b border-ink-200/80 bg-white/90 backdrop-blur-xl">
    <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <button
        className="flex items-center gap-3 rounded-lg text-left transition hover:opacity-80"
        onClick={onHome}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-base font-bold text-ink-900">Decision Matrix AI</span>
          <span className="hidden text-xs text-ink-500 sm:block">Compare anything. Decide with clarity.</span>
        </span>
      </button>
      <div className="flex items-center gap-3">
        {saveStatus !== "idle" ? (
          <Badge
            tone={
              saveStatus === "saved" ? "green" : saveStatus === "error" ? "red" : "default"
            }
          >
            {saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Saving"}
          </Badge>
        ) : null}
        <Button variant="ghost" icon={<Info className="h-4 w-4" />} onClick={onAbout}>
          About
        </Button>
        <Button icon={<Plus className="h-4 w-4" />} onClick={onNewMatrix}>
          New matrix
        </Button>
      </div>
    </div>
  </header>
);
