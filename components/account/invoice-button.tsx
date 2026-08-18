"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceButton() {
  return (
    <Button variant="outline" className="font-heading" onClick={() => window.print()}>
      <FileDown />
      Download PDF invoice
    </Button>
  );
}
