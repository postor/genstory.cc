"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

interface BaseInteractionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  confirmDisabled?: boolean;
  cancelLabel?: string | null;
  onConfirm: () => void;
  children?: ReactNode;
}

export function InteractionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  confirmDisabled = false,
  cancelLabel = null,
  onConfirm,
  children,
}: BaseInteractionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription className="whitespace-pre-line">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        {children ? <div className="space-y-3">{children}</div> : null}
        <DialogFooter>
          {cancelLabel ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PromptModalProps extends Omit<BaseInteractionModalProps, "children"> {
  inputLabel: string;
  inputPlaceholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
}

export function PromptModal({
  inputLabel,
  inputPlaceholder,
  value,
  onValueChange,
  onConfirm,
  children,
  ...props
}: PromptModalProps) {
  return (
    <InteractionModal onConfirm={onConfirm} {...props}>
      <div className="space-y-2">
        <Label htmlFor="interaction-modal-input">{inputLabel}</Label>
        <Input
          id="interaction-modal-input"
          autoFocus
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !props.confirmDisabled) {
              event.preventDefault();
              onConfirm();
            }
          }}
          placeholder={inputPlaceholder}
        />
      </div>
      {children}
    </InteractionModal>
  );
}
