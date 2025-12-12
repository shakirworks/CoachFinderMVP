import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, ArrowLeft, Loader2, Download, FileText } from "lucide-react";

interface PaymentStatus {
  success: boolean;
  status: string;
  purchaseId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export default function BookingSuccess() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");

  const { data: paymentStatus, isLoading, error } = useQuery<PaymentStatus>({
    queryKey: [`/api/bookings/verify/${sessionId}`],
    enabled: !!sessionId,
  });

  const handleDownloadReceipt = () => {
    if (paymentStatus?.invoiceId) {
      window.open(`/api/invoices/${paymentStatus.invoiceId}/receipt`, '_blank');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No payment session found. Please try booking again.
            </p>
            <Link href="/coaches">
              <Button data-testid="button-browse-coaches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse Coaches
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Confirming your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !paymentStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Payment Status Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We couldn't verify your payment status. Please check your bookings or contact support.
            </p>
            <Link href="/coaches">
              <Button data-testid="button-browse-coaches">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse Coaches
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Your coaching sessions have been booked successfully. You'll receive a confirmation email shortly.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Payment Status:</span>
              <span className="text-green-600 dark:text-green-400 capitalize">
                {paymentStatus.status || "Confirmed"}
              </span>
            </div>
            {paymentStatus.invoiceNumber && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Invoice:</span>
                <span className="text-muted-foreground">
                  {paymentStatus.invoiceNumber}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {paymentStatus.invoiceId && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadReceipt}
                data-testid="button-download-receipt"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
            <Link href="/coaches">
              <Button className="w-full" data-testid="button-browse-more">
                Book More Sessions
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full" data-testid="button-go-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
