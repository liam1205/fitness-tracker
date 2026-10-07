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
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ModalButton {
  label: React.ReactNode;
  /** Optional icon rendered before the label, e.g. `<Trash />`. */
  icon?: React.ReactNode;
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
  /** Icon for the close button. Defaults to an "x" icon. */
  closeIcon?: React.ReactNode;
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

function renderButton(button: ModalButton, index: number) {
  return (
    <Button
      key={index}
      variant={button.variant}
      disabled={button.disabled}
      onClick={button.onClick}
    >
      {button.icon}
      {button.label}
    </Button>
  );
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

/**
 * Renders the single app-wide modal instance. Mount once near the root, next
 * to the other providers in main.tsx.
 */
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
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
            className={cn(modal.className, "w-4/5")}
            showCloseButton={modal.showCloseIcon ?? true}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">{modal.title}</DialogTitle>
              {modal.subtitle && (
                <DialogDescription>{modal.subtitle}</DialogDescription>
              )}
            </DialogHeader>

            {modal.content}

            <DialogFooter className="flex flex-row items-between sm:justify-between">
              <div className="flex flex-row justify-start gap-1 w-1/2">
                <DialogClose asChild>
                  <Button variant="outline">
                    {modal.closeIcon ?? <X />}
                    {modal.closeLabel ?? t("common.actions.close")}
                  </Button>
                </DialogClose>
                {modal.leftButtons?.map(renderButton)}
              </div>
              <div className="flex flex-row justify-end gap-1 w-1/2">
                {modal.rightButtons?.map(renderButton)}
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
