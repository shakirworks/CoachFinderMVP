import { format, parseISO } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Calendar, Clock, CreditCard } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SelectedSlot } from "./AvailabilityCalendar";

interface BookingQuote {
  coachId: string;
  coachName: string;
  hourlyRate: number;
  slots: SelectedSlot[];
  subtotal: number;
  serviceFee: number;
  serviceFeePercentage: number;
  totalAmount: number;
  currency: string;
}

interface BookingSummaryCardProps {
  coachId: string;
  coachName: string;
  hourlyRate: number;
  selectedSlots: SelectedSlot[];
  onRemoveSlot: (slotId: string) => void;
  onClearAll: () => void;
  athleteId?: string;
}

export function BookingSummaryCard({
  coachId,
  coachName,
  hourlyRate,
  selectedSlots,
  onRemoveSlot,
  onClearAll,
  athleteId,
}: BookingSummaryCardProps) {
  const quoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bookings/quote", {
        coachId,
        slotIds: selectedSlots.map(s => s.slotId),
      });
      return (await res.json()) as BookingQuote;
    },
  });

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(":");
    let h = parseInt(hours);
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${minutes} ${period}`;
  };

  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const subtotalCents = hourlyRate * 100 * selectedSlots.length;
  const serviceFeeCents = Math.round(subtotalCents * 0.10);
  const totalCents = subtotalCents + serviceFeeCents;

  const groupedSlots = selectedSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, SelectedSlot[]>);

  const sortedDates = Object.keys(groupedSlots).sort();

  if (selectedSlots.length === 0) {
    return null;
  }

  return (
    <Card className="xl:sticky xl:top-4">
      <CardHeader className="p-3 sm:p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Booking Summary</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-muted-foreground h-7 px-2"
            data-testid="button-clear-all"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {selectedSlots.length} Session{selectedSlots.length > 1 ? "s" : ""} Selected
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2">
            {sortedDates.map((date) => (
              <div key={date} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {format(parseISO(date), "EEE, MMM d")}
                </div>
                <div className="space-y-1">
                  {groupedSlots[date]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <div
                        key={slot.slotId}
                        className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded-md"
                        data-testid={`summary-slot-${slot.slotId}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs">
                            {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={() => onRemoveSlot(slot.slotId)}
                          data-testid={`button-remove-slot-${slot.slotId}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {selectedSlots.length} x ${hourlyRate}/hr
            </span>
            <span data-testid="text-subtotal">{formatCurrency(subtotalCents)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Service fee (10%)</span>
            <span data-testid="text-service-fee">{formatCurrency(serviceFeeCents)}</span>
          </div>
          <Separator className="my-1.5" />
          <div className="flex justify-between gap-2 font-semibold text-sm">
            <span>Total</span>
            <span data-testid="text-total">{formatCurrency(totalCents)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex-col gap-2">
        <Button
          className="w-full"
          disabled={true}
          data-testid="button-proceed-payment"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Proceed to Payment
        </Button>
        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          Payment integration coming soon
        </p>
      </CardFooter>
    </Card>
  );
}
