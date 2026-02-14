"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { formatCurrency } from "@/lib/format";
import {
  Download,
  Printer,
  Mail,
  CheckCircle2,
  FileText,
  Building2,
  Phone,
  MapPin,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export interface ReceiptData {
  invoiceNumber: string;
  dateIssued: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomRate: number;
  items: { description: string; qty: number; unitPrice: number }[];
  paymentMethod: string;
  paymentStatus: "paid" | "unpaid" | "partial";
  discount?: number;
}

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData;
}

export default function ReceiptDialog({ open, onOpenChange, data }: ReceiptDialogProps) {
  const { t, isRw } = useI18n();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  const discount = data.discount || 0;
  const taxRate = 0.18;
  const taxAmount = Math.round((subtotal - discount) * taxRate);
  const grandTotal = subtotal - discount + taxAmount;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Create a printable version
      const printContent = receiptRef.current;
      if (!printContent) return;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error(isRw ? "Ntishobora gufungura idirisha rishya" : "Could not open new window");
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - ${data.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; color: #1A1A2E; }
            .receipt { max-width: 700px; margin: 0 auto; border: 1px solid #e5e7eb; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #0B6E4F; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #0B6E4F; margin: 0; font-size: 28px; }
            .header .gold { color: #C8A951; }
            .header p { color: #6B6B7B; margin: 5px 0; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { background: #f9fafb; border-radius: 8px; padding: 15px; }
            .info-box h3 { font-size: 12px; text-transform: uppercase; color: #6B6B7B; margin: 0 0 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #0B6E4F; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .totals { text-align: right; margin-top: 10px; }
            .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 5px 12px; font-size: 14px; }
            .totals .grand { background: #0B6E4F; color: white; border-radius: 6px; font-weight: bold; font-size: 16px; padding: 10px 12px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6B6B7B; font-size: 12px; }
            .badge { display: inline-block; background: #10B981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            @media print { body { padding: 0; } .receipt { border: none; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>East<span class="gold">Gate</span> Hotel</h1>
              <p>KG 7 Ave, Kigali, Rwanda | +250 788 000 000</p>
              <p>reservations@eastgatehotel.rw | TIN: 123456789</p>
              <h2 style="margin-top: 15px; font-size: 18px;">${isRw ? "INYEMEZABUGUZI" : "PAYMENT RECEIPT"}</h2>
            </div>
            <div class="info-grid">
              <div class="info-box">
                <h3>${isRw ? "Nimero y'Inyemezabuguzi" : "Invoice Number"}</h3>
                <p style="font-weight: 600; margin: 0;">${data.invoiceNumber}</p>
                <h3 style="margin-top: 10px;">${isRw ? "Itariki" : "Date"}</h3>
                <p style="margin: 0;">${data.dateIssued}</p>
              </div>
              <div class="info-box">
                <h3>${isRw ? "Yishyurwa na" : "Bill To"}</h3>
                <p style="font-weight: 600; margin: 0;">${data.guestName}</p>
                <p style="margin: 3px 0; font-size: 13px;">${data.guestEmail}</p>
                <p style="margin: 3px 0; font-size: 13px;">${data.guestPhone}</p>
              </div>
            </div>
            <div class="info-box" style="margin-bottom: 15px;">
              <div style="display: flex; gap: 30px;">
                <div><h3>${isRw ? "Icyumba" : "Room"}</h3><p style="margin: 0;">${data.roomNumber}</p></div>
                <div><h3>${isRw ? "Kwinjira" : "Check-in"}</h3><p style="margin: 0;">${data.checkIn}</p></div>
                <div><h3>${isRw ? "Gusohoka" : "Check-out"}</h3><p style="margin: 0;">${data.checkOut}</p></div>
                <div><h3>${isRw ? "Amajoro" : "Nights"}</h3><p style="margin: 0;">${data.nights}</p></div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>${isRw ? "Igisobanuro" : "Description"}</th>
                  <th style="text-align: center;">${isRw ? "Umubare" : "Qty"}</th>
                  <th style="text-align: right;">${isRw ? "Igiciro" : "Unit Price"}</th>
                  <th style="text-align: right;">${isRw ? "Igiteranyo" : "Amount"}</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
                    <td style="text-align: right;">${formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="totals">
              <div class="row"><span>${isRw ? "Igiteranyo Gito" : "Subtotal"}:</span><span>${formatCurrency(subtotal)}</span></div>
              ${discount > 0 ? `<div class="row" style="color: #10B981;"><span>${isRw ? "Igabanuka" : "Discount"}:</span><span>-${formatCurrency(discount)}</span></div>` : ""}
              <div class="row"><span>${isRw ? "Umusoro (18% VAT)" : "Tax (18% VAT)"}:</span><span>${formatCurrency(taxAmount)}</span></div>
              <div class="row grand"><span>${isRw ? "IGITERANYO CYOSE" : "GRAND TOTAL"}:</span><span>${formatCurrency(grandTotal)}</span></div>
            </div>
            <div style="margin-top: 15px; text-align: right;">
              <span>${isRw ? "Uburyo bwo Kwishyura" : "Payment Method"}: <strong>${data.paymentMethod}</strong></span>
              <span class="badge" style="margin-left: 10px;">${data.paymentStatus === "paid" ? (isRw ? "BYISHYUWE" : "PAID") : (isRw ? "NTIBYISHYUWE" : "UNPAID")}</span>
            </div>
            <div class="footer">
              <p style="font-size: 14px; color: #0B6E4F; font-weight: 600;">${isRw ? "Murakoze guturamo!" : "Thank you for staying with us!"}</p>
              <p>© 2026 EastGate Hotel Rwanda. All rights reserved.</p>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      toast.success(t("receipt", "receiptGenerated"));
    } catch {
      toast.error(isRw ? "Byanze gukoporo" : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = () => {
    toast.success(
      isRw
        ? `Inyemezabuguzi yoherejwe kuri ${data.guestEmail}`
        : `Receipt emailed to ${data.guestEmail}`
    );
  };

  const statusColor = {
    paid: "bg-emerald-100 text-emerald-700",
    unpaid: "bg-red-100 text-red-700",
    partial: "bg-yellow-100 text-yellow-700",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald" />
            </div>
            {t("receipt", "title")}
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="space-y-4 py-2">
          {/* Hotel Header */}
          <div className="text-center border-b-2 border-emerald pb-4">
            <h2 className="font-heading text-2xl font-bold text-charcoal">
              East<span className="text-gold">Gate</span> Hotel
            </h2>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted-custom">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> KG 7 Ave, Kigali</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> +250 788 000 000</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> eastgatehotel.rw</span>
            </div>
            <p className="text-[10px] text-text-muted-custom mt-1">TIN: 123456789</p>
          </div>

          {/* Invoice Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pearl/50 rounded-lg p-3">
              <p className="text-[10px] uppercase text-text-muted-custom font-semibold">{t("receipt", "invoiceNumber")}</p>
              <p className="font-mono font-bold text-charcoal">{data.invoiceNumber}</p>
              <p className="text-[10px] uppercase text-text-muted-custom font-semibold mt-2">{t("receipt", "dateIssued")}</p>
              <p className="text-sm text-charcoal">{data.dateIssued}</p>
            </div>
            <div className="bg-pearl/50 rounded-lg p-3">
              <p className="text-[10px] uppercase text-text-muted-custom font-semibold">{t("receipt", "billTo")}</p>
              <p className="font-semibold text-charcoal">{data.guestName}</p>
              <p className="text-xs text-text-muted-custom">{data.guestEmail}</p>
              <p className="text-xs text-text-muted-custom">{data.guestPhone}</p>
            </div>
          </div>

          {/* Stay Summary */}
          <div className="bg-emerald/5 rounded-lg p-3 flex gap-6 text-sm">
            <div>
              <p className="text-[10px] uppercase text-text-muted-custom">{isRw ? "Icyumba" : "Room"}</p>
              <p className="font-semibold">{data.roomNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-text-muted-custom">{isRw ? "Kwinjira" : "Check-in"}</p>
              <p className="font-semibold">{data.checkIn}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-text-muted-custom">{isRw ? "Gusohoka" : "Check-out"}</p>
              <p className="font-semibold">{data.checkOut}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-text-muted-custom">{isRw ? "Amajoro" : "Nights"}</p>
              <p className="font-semibold">{data.nights}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald text-white">
                  <th className="text-left px-3 py-2 text-xs font-semibold">{t("receipt", "description")}</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold">{t("receipt", "quantity")}</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">{t("receipt", "unitPrice")}</th>
                  <th className="text-right px-3 py-2 text-xs font-semibold">{t("receipt", "amount")}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-pearl/30">
                    <td className="px-3 py-2.5">{item.description}</td>
                    <td className="px-3 py-2.5 text-center">{item.qty}</td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between px-3">
              <span className="text-text-muted-custom">{t("receipt", "subtotal")}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between px-3 text-emerald">
                <span>{t("receipt", "discount")}</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between px-3">
              <span className="text-text-muted-custom">{t("receipt", "tax")}</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between px-3 py-2 bg-emerald text-white rounded-lg font-bold text-base">
              <span>{t("receipt", "grandTotal")}</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="flex items-center justify-between px-3">
            <div className="text-sm">
              <span className="text-text-muted-custom">{t("receipt", "paymentMethod")}: </span>
              <span className="font-semibold">{data.paymentMethod}</span>
            </div>
            <Badge className={statusColor[data.paymentStatus]}>
              {data.paymentStatus === "paid" ? t("receipt", "paid") : data.paymentStatus === "unpaid" ? t("receipt", "unpaid") : t("receipt", "partiallyPaid")}
            </Badge>
          </div>

          {/* Thank you */}
          <div className="text-center py-3 border-t">
            <p className="text-emerald font-semibold">{t("receipt", "thankYou")}</p>
            <p className="text-[10px] text-text-muted-custom mt-1">© 2026 EastGate Hotel Rwanda</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleDownload} className="flex-1 bg-emerald hover:bg-emerald-dark text-white gap-2" disabled={downloading}>
            {downloading ? (
              <>{t("receipt", "downloading")}</>
            ) : (
              <><Download className="h-4 w-4" /> {t("receipt", "downloadReceipt")}</>
            )}
          </Button>
          <Button variant="outline" onClick={handleEmail} className="gap-2">
            <Mail className="h-4 w-4" /> {t("receipt", "emailReceipt")}
          </Button>
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
