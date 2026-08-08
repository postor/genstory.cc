"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import helperIcon from "@/docs/design/icons/helper-icon.png";
import { useLang } from "@/lib/i18n";

type OpenRouterAuthDialogProps = {
  open: boolean;
  onCancel: () => void;
  onAuthorize: () => void;
};

export function OpenRouterAuthDialog({
  open,
  onCancel,
  onAuthorize,
}: OpenRouterAuthDialogProps) {
  const { t } = useLang();

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onCancel();
      }}
    >
      <DialogContent
        onClick={(event) => event.stopPropagation()}
        showCloseButton={false}
        className="max-w-md overflow-hidden p-4"
      >
        <DialogHeader className="gap-4 px-1 pt-1 sm:px-2 sm:pt-2">
          <div className="flex items-start gap-3">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#f3efff] ring-1 ring-[#e8e0ff]">
              <Image
                src={helperIcon}
                alt={t("mcp.assistantAvatarAlt")}
                width={56}
                height={56}
                sizes="56px"
                className="size-14 object-contain"
              />
            </div>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-[#7653db]">
                {t("mcp.assistantName")}
              </p>
              <DialogTitle className="mt-1 text-lg leading-6">
                {t("mcp.authTitle")}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="leading-6">
            {t("mcp.authDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-1 pb-1 sm:px-2 sm:pb-2">
          <div className="rounded-xl border border-[#e8e0ff] bg-[#f8f5ff] px-4 py-3">
            <p className="text-sm font-semibold text-[#372272]">
              {t("mcp.authCostTitle")}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-[#6d5d9b]">
              {t("mcp.authCostDescription")}
            </p>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("mcp.authAlternativeNote")}
          </p>
        </div>

        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onAuthorize}>{t("mcp.authorize")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
