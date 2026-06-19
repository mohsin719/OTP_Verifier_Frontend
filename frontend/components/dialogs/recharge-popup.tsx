"use client";

import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";

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
  const adminWhatsApp = "+923233371766";

  const whatsappMsg = user?.publicId
    ? `Hello, I want to add balance.\nUser ID: ${user.publicId}`
    : "Hello, I want to add balance.";

  const copyToClipboard = async (value: string, successMessage: string): Promise<boolean> => {
    if (!value) {
      return false;
    }
    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(value);
      alert(successMessage);
      return true;
    } catch {
      alert("Clipboard permission denied. Please copy manually.");
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insufficient Balance</DialogTitle>
          <DialogDescription>
            {description
              ? description
              : servicePrice
                ? `You need at least Rs ${servicePrice} to lease a number for this service. Contact admin via WhatsApp to top up.`
                : "Send a message on WhatsApp to add balance to your account."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Admin WhatsApp: <span className="font-semibold">{adminWhatsApp}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            For balance recharge, please contact admin via WhatsApp with your user ID.
          </p>
          {showMinimumMessage && (
            <p className="text-xs text-amber-500/90">
              A minimum recharge of Rs 500 is required.
            </p>
          )}
          {servicePrice && (
            <p className="text-xs text-muted-foreground">
              Service price: Rs {servicePrice}
            </p>
          )}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              try {
                void copyToClipboard(whatsappMsg, "Message copied.");
              } catch (err) {
                console.error("Copy failed:", err);
              }
            }}
          >
            <Copy className="h-4 w-4" />
            Copy top-up message
          </Button>
          <Button
            className="w-full gap-2"
            onClick={() => {
              try {
                window.open("https://wa.me/923233371766", "_blank");
              } catch (err) {
                console.error("WhatsApp open failed:", err);
              }
            }}
          >
            <MessageCircle className="h-4 w-4" />
            Open WhatsApp
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              try {
                void copyToClipboard("923233371766", "WhatsApp number copied.");
              } catch (err) {
                console.error("Copy failed:", err);
              }
            }}
          >
            <Copy className="h-4 w-4" />
            Copy WhatsApp number
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
