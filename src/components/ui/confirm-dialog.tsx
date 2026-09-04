"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const ignoreCloseRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      ignoreCloseRef.current = false;
      dialog.showModal();
    } else if (!open && dialog.open) {
      ignoreCloseRef.current = true;
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onCancel();
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, onCancel]);

  const handleDialogClose = () => {
    if (ignoreCloseRef.current) {
      ignoreCloseRef.current = false;
      return;
    }
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "fixed left-1/2 top-1/2 w-[min(92vw,28rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
        "rounded-xl border border-border bg-background p-0 shadow-lg",
        "backdrop:bg-black/40",
      )}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClose={handleDialogClose}
    >
      <div className="p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
