"use client";

import { Copy, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildWhatsAppUrl } from "@/lib/env";
import { useAuthStore } from "@/stores/auth-store";

const ADMIN_WHATSAPP_E164 = "+923233371766";
const MIN_RECHARGE_PKR = 500;

interface RechargePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicePrice?: number;
  showMinimumMessage?: boolean;
  description?: string;
}

export function RechargePopup({
  open,
  onOpenChange,
  servicePrice,
  showMinimumMessage = true,
  description,
}: RechargePopupProps) {
  const user = useAuthStore((s) => s.user);

  const whatsappMsg = user?.publicId
    ? `Hello, I want to add balance.\nUser ID: ${user.publicId}`
    : "Hello, I want to add balance.";

  const whatsappUrl = buildWhatsAppUrl(ADMIN_WHATSAPP_E164, whatsappMsg);

  const summaryMessage =
    description ??
    (servicePrice
      ? `You need at least Rs ${servicePrice} to lease a number for this service.`
      : "Add balance to continue using US Num Hub.");

  const copyToClipboard = async (
    value: string,
    successMessage: string,
  ): Promise<void> => {
    if (!value) return;
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="recharge-popup gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="recharge-popup__header pr-12">
          <div className="recharge-popup__icon-wrap">
            <Wallet className="h-5 w-5" />
          </div>
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg font-bold tracking-tight">
              Insufficient Balance
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              {summaryMessage}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="recharge-popup__body space-y-4 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="recharge-popup__info-grid">
            {showMinimumMessage ? (
              <div className="recharge-popup__info-item">
                <span className="recharge-popup__info-label">Minimum top-up</span>
                <span className="recharge-popup__info-value">
                  Rs {MIN_RECHARGE_PKR}
                </span>
              </div>
            ) : null}
            {servicePrice ? (
              <div className="recharge-popup__info-item">
                <span className="recharge-popup__info-label">Service price</span>
                <span className="recharge-popup__info-value">
                  Rs {servicePrice}
                </span>
              </div>
            ) : null}
            {user?.publicId ? (
              <div className="recharge-popup__info-item recharge-popup__info-item--full">
                <span className="recharge-popup__info-label">Your user ID</span>
                <span className="recharge-popup__info-value font-mono">
                  {user.publicId}
                </span>
              </div>
            ) : null}
          </div>

          <div className="recharge-popup__contact">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin WhatsApp
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {ADMIN_WHATSAPP_E164}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Send your user ID on WhatsApp to recharge your wallet.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              className="recharge-popup__wa-btn h-11 w-full gap-2 font-semibold"
              onClick={() => {
                window.open(whatsappUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp
            </Button>
            <Button
              variant="outline"
              className="h-10 w-full gap-2"
              onClick={() => void copyToClipboard(whatsappMsg, "Top-up message copied.")}
            >
              <Copy className="h-4 w-4" />
              Copy top-up message
            </Button>
            <button
              type="button"
              className="recharge-popup__copy-link"
              onClick={() =>
                void copyToClipboard("923233371766", "WhatsApp number copied.")
              }
            >
              <Copy className="h-3.5 w-3.5" />
              Copy WhatsApp number
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
