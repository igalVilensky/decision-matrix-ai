import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card } from "./Card";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <Card className="flex flex-col items-center justify-center px-6 py-12 text-center" tone="soft">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
      <Sparkles className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-bold text-ink-900">{title}</h3>
    <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </Card>
);
