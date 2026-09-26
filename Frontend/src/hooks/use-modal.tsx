import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ModalButton {
  label: React.ReactNode;
  onClick?: () => void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  disabled?: boolean;
}

export interface ModalOptions {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
  /** Extra buttons shown left-aligned, alongside the always-present "Close" button. */
  leftButtons?: ModalButton[];
  /** Buttons shown right-aligned in the footer. */
  rightButtons?: ModalButton[];
  /** Label for the always-present close button. Defaults to "Close". */
  closeLabel?: string;
  /** Show the "x" icon button in the top-right corner. Defaults to true. */
  showCloseIcon?: boolean;
  /** Extra classes applied to the dialog content, e.g. to widen it. */
  className?: string;
  /** Called whenever the modal closes, regardless of how it was closed. */
  onClose?: () => void;
}

interface ModalContextValue {
  openModal: (options: ModalOptions) => void;
  updateModal: (patch: Partial<ModalOptions>) => void;
  closeModal: () => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

/**
 * Renders the single app-wide modal instance. Mount once near the root, next
 * to the other providers in main.tsx.
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = React.useState<ModalOptions | null>(null);
  const [open, setOpen] = React.useState(false);

  const closeModal = React.useCallback(() => {
    setOpen(false);
  }, []);

  const openModal = React.useCallback((options: ModalOptions) => {
    setModal(options);
    setOpen(true);
  }, []);

  const updateModal = React.useCallback((patch: Partial<ModalOptions>) => {
    setModal((current) => (current ? { ...current, ...patch } : current));
  }, []);

  // Keep the previous modal's content mounted while it is closed, so
  // DialogContent can play its exit animation instead of going blank.
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) {
        modal?.onClose?.();
      }
    },
    [modal],
  );

  const value = React.useMemo(
    () => ({ openModal, updateModal, closeModal }),
    [openModal, updateModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {modal && (
          <DialogContent
            className={modal.className}
            showCloseButton={modal.showCloseIcon ?? true}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">{modal.title}</DialogTitle>
              {modal.subtitle && (
                <DialogDescription>{modal.subtitle}</DialogDescription>
              )}
            </DialogHeader>

            {modal.content}

            <DialogFooter className="items-start sm:justify-between">
              <div className="flex flex-row items-start gap-2">
                <DialogClose asChild>
                  <Button variant="outline">
                    {modal.closeLabel ?? "Close"}
                  </Button>
                </DialogClose>
                {modal.leftButtons?.map((button, index) => (
                  <Button
                    key={index}
                    variant={button.variant}
                    disabled={button.disabled}
                    onClick={button.onClick}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-row items-end gap-2">
                {modal.rightButtons?.map((button, index) => (
                  <Button
                    key={index}
                    variant={button.variant}
                    disabled={button.disabled}
                    onClick={button.onClick}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </ModalContext.Provider>
  );
}

/**
 * Orchestrates the app's single shared modal. Call `openModal` with the
 * header, content and footer buttons to show; the "Close" button on the
 * left is added automatically.
 */
export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
