"use client";

import { Wallet, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddBalanceHub } from "@/components/wallet/add-balance-hub";
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
  description,
}: RechargePopupProps) {
  const user = useAuthStore((s) => s.user);

  const summaryMessage =
    description ??
    (servicePrice
      ? `You need at least Rs ${servicePrice} to lease a number for this service. Select your preferred payment method below to top up.`
      : "Add funds via Binance (USDT) or JazzCash/EasyPaisa to continue leasing numbers.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-white border border-slate-200 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1.5 text-left border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-extrabold text-slate-900">
                Deposit &amp; Add Balance
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 line-clamp-2">
                {summaryMessage}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <AddBalanceHub onSuccessClose={() => onOpenChange(false)} compact={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
