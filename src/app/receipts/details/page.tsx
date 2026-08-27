'use client';
import ReceiptDetails from "@/components/admissions/receipt-details";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, notFound, useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer, Share2, Loader2, PlusCircle } from "lucide-react";
import * as React from "react";
import { useRef, Suspense } from "react";
// Dynamic imports for browser-only libraries handled in the function to avoid SSR initialization errors
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Admission, Academy } from "@/types";
import { useAcademy } from "@/context/academy-context";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import Link from 'next/link';

function ReceiptContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const admissionId = searchParams.get('id');
  const { queuedActions, academy: posBusiness, user, admissions } = useAcademy();

  const firestore = useFirestore();
  const receiptRef = useMemoFirebase(() => (firestore && admissionId ? doc(firestore, 'admissions', admissionId) : null), [firestore, admissionId]);
  const { data: firestoreReceipt, isLoading: isReceiptLoading } = useDoc<Admission>(receiptRef);

  const receipt = React.useMemo(() => {
      if (firestoreReceipt) return firestoreReceipt;
      if (!admissionId) return null;
      const cached = admissions?.find(r => r.id === admissionId);
      if (cached) return cached;
      const action = queuedActions?.find(a => a.type === 'complete-registration' && a.payload.receiptData.id === admissionId);
      if (action) return action.payload.receiptData;
      return null;
  }, [firestoreReceipt, admissionId, queuedActions, admissions]);

  // Fetch academy info directly from Firestore if not provided by global POS context (e.g. public link)
  const businessRef = useMemoFirebase(() => (firestore && receipt?.academyId ? doc(firestore, 'businessInstances', receipt.academyId) : null), [firestore, receipt?.academyId]);
  const { data: dbBusiness, isLoading: isBusinessLoading } = useDoc<Academy>(businessRef);

  const academy = posBusiness || dbBusiness;
  const currencySymbol = academy?.settings?.currency ? CURRENCY_SYMBOLS[academy.settings.currency] : '₦';

  const router = useRouter();
  const receiptContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
      setMounted(true);
  }, []);

  const isLoading = isReceiptLoading || (receipt && !academy && isBusinessLoading);

  if (!mounted || (isLoading && !receipt) || !firestore) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading document...</span></div>;
  }

  if (!admissionId || !receipt) {
    notFound();
  }

  // If this is an invoice, redirect to the invoice detail page
  if (receipt.paymentMethod === 'Invoice') {
    router.replace(`/invoice/details?id=${receipt.id}`);
    return null;
  }

  const isInvoice = false;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (receiptContentRef.current) {
      toast({ title: "Generating PDF...", description: "Please wait while we prepare your document." });
      
      // Dynamic imports to prevent SSR/Build errors
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(receiptContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const filename = isInvoice ? `invoice-${receipt.id.substring(0, 8)}.pdf` : `receipt-${receipt.id.substring(0, 8)}.pdf`;
      pdf.save(filename);
      toast({ title: "Download Started", description: `${isInvoice ? 'Invoice' : 'Admission'} has been generated.`, variant: 'success' });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast({
        title: "Link Copied",
        description: `${isInvoice ? 'Invoice' : 'Admission'} link has been copied to your clipboard.`,
        variant: 'success'
      });
    }, () => {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: 'destructive'
      });
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `${isInvoice ? 'Invoice' : 'Admission'} ${receipt.id.substring(0, 8)}`,
      text: `Here is your ${isInvoice ? 'invoice' : 'receipt'} from ${academy?.name || 'our store'} for ${currencySymbol}${receipt.total.toFixed(2)}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          toast({
            title: "Share failed",
            description: "Link copied to clipboard instead.",
            variant: 'warning',
          });
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {user && (
        <div className="w-full max-w-2xl flex justify-start no-print">
          <Button variant="ghost" asChild size="sm">
            <Link href="/admissions">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Link>
          </Button>
        </div>
      )}

      <div ref={receiptContentRef} className="border rounded-lg bg-card overflow-hidden">
        <ReceiptDetails receipt={receipt} academy={academy} currencySymbol={currencySymbol} isInvoice={isInvoice} />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 no-print">
        {user && (
          <Button asChild variant="outline">
            <Link href="/cbt-simulator/select-subjects"><PlusCircle className="mr-2 h-4 w-4" /> New Simulation</Link>
          </Button>
        )}
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button onClick={handleDownload} variant="default">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
        <Button onClick={handleShare} variant="outline">
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ReceiptContent />
    </Suspense>
  );
}
