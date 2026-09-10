"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { getReceipt, getReceiptText } from "@/features/pos/api";
import { formatMinorUnits } from "@/lib/money";

type ReceiptModalProps = {
  orderId: string;
  onClose: () => void;
  onNewSale: () => void;
};

export function ReceiptModal({ orderId, onClose, onNewSale }: ReceiptModalProps) {
  const receiptQuery = useQuery({
    queryKey: ["pos", "receipt", orderId],
    queryFn: () => getReceipt(orderId),
  });

  async function handlePrint() {
    try {
      const text = await getReceiptText(orderId);
      const popup = window.open("", "_blank", "noopener,noreferrer,width=420,height=640");
      if (!popup) {
        window.alert("Allow pop-ups to print the receipt.");
        return;
      }
      popup.document.write(
        `<pre style="font:14px/1.4 ui-monospace,monospace;white-space:pre-wrap;padding:16px">${text
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")}</pre>`,
      );
      popup.document.close();
      popup.focus();
      popup.print();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not load receipt text",
      );
    }
  }

  const receipt = receiptQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id="receipt-title" className="text-xl font-bold text-foreground">
          Sale complete
        </h2>

        {receiptQuery.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Loading receipt…</p>
        ) : null}

        {receiptQuery.isError ? (
          <p className="mt-4 text-sm text-red-600">
            {(receiptQuery.error as Error).message}
          </p>
        ) : null}

        {receipt ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-semibold text-brand-rich-teal">
              {receipt.business_name}
            </p>
            <p className="text-muted-foreground">
              Receipt #{receipt.receipt_number}
            </p>
            <ul className="divide-y divide-border border-y border-border">
              {receipt.items.map((item, index) => (
                <li
                  key={`${item.product_name}-${index}`}
                  className="flex justify-between gap-3 py-2"
                >
                  <span>
                    {item.product_name} × {item.quantity}
                  </span>
                  <span>
                    {formatMinorUnits(item.line_total_minor, receipt.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>
                {formatMinorUnits(receipt.total_minor, receipt.currency)}
              </span>
            </div>
            {receipt.payments.map((payment, index) => (
              <div key={`${payment.method}-${index}`} className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span className="capitalize">{payment.method} tendered</span>
                  <span>
                    {formatMinorUnits(payment.amount_minor, receipt.currency)}
                  </span>
                </div>
                {payment.change_minor != null && payment.change_minor > 0 ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Change</span>
                    <span>
                      {formatMinorUnits(payment.change_minor, receipt.currency)}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="flex-1" onClick={handlePrint}>
            Print receipt
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onNewSale}
          >
            New sale
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
