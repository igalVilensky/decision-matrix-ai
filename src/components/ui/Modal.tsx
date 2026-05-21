import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export const Modal = ({ title, description, isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-lift">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-ink-900">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            icon={<X className="h-5 w-5" />}
            onClick={onClose}
          >
            Close modal
          </Button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6 matrix-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
