import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AvailabilitySlot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AvailabilityCalendarProps {
  coachId: string;
  isEditable?: boolean;
}

export function AvailabilityCalendar({ coachId, isEditable = false }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const { toast } = useToast();

  const { data: slots = [], isLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["/api/availability", coachId],
  });

  const createSlotMutation = useMutation({
    mutationFn: async (slotData: { coachId: string; date: string; startTime: string; endTime: string }) => {
      const res = await apiRequest("POST", `/api/availability`, slotData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", coachId] });
      setIsAddingSlot(false);
      setStartTime("");
      setEndTime("");
      toast({
        title: "Success",
        description: "Time slot added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add time slot",
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const res = await apiRequest("DELETE", `/api/availability/${slotId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", coachId] });
      toast({
        title: "Success",
        description: "Time slot removed successfully",
      });
    },
  });

  const clearDayMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await apiRequest("DELETE", `/api/availability/${coachId}/${date}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability", coachId] });
      toast({
        title: "Success",
        description: "Day marked as unavailable",
      });
    },
  });

  const getDateSlots = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.filter((slot) => slot.date === dateStr);
  };

  const getDatesWithAvailability = () => {
    const datesSet = new Set(slots.map((slot) => slot.date));
    return Array.from(datesSet).map((dateStr) => parseISO(dateStr));
  };

  const handleAddSlot = () => {
    if (!selectedDate || !startTime || !endTime) {
      toast({
        title: "Error",
        description: "Please select a date and time range",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    createSlotMutation.mutate({
      coachId,
      date: dateStr,
      startTime,
      endTime,
    });
  };

  const handleClearDay = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    clearDayMutation.mutate(dateStr);
  };

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        times.push(timeStr);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();
  const selectedDateSlots = selectedDate ? getDateSlots(selectedDate) : [];
  const availableDates = getDatesWithAvailability();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              available: availableDates,
            }}
            modifiersStyles={{
              available: {
                backgroundColor: "hsl(var(--primary) / 0.1)",
                color: "hsl(var(--primary))",
                fontWeight: "bold",
              },
            }}
            data-testid="calendar-availability"
          />
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">
              {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
            {isEditable && selectedDateSlots.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearDay}
                disabled={clearDayMutation.isPending}
                data-testid="button-clear-day"
              >
                <X className="h-4 w-4 mr-1" />
                Mark Unavailable
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="text-no-slots">
                No availability for this day
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDateSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`slot-${slot.id}`}
                  >
                    <Badge variant="outline" className="text-sm">
                      {slot.startTime} - {slot.endTime}
                    </Badge>
                    {isEditable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSlotMutation.mutate(slot.id)}
                        disabled={deleteSlotMutation.isPending}
                        data-testid={`button-delete-slot-${slot.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isEditable && (
              <div className="pt-4 border-t space-y-4">
                {!isAddingSlot ? (
                  <Button
                    onClick={() => setIsAddingSlot(true)}
                    className="w-full"
                    variant="outline"
                    data-testid="button-add-slot"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Slot
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Time</label>
                        <Select value={startTime} onValueChange={setStartTime}>
                          <SelectTrigger data-testid="select-start-time">
                            <SelectValue placeholder="Start" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Time</label>
                        <Select value={endTime} onValueChange={setEndTime}>
                          <SelectTrigger data-testid="select-end-time">
                            <SelectValue placeholder="End" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddSlot}
                        disabled={createSlotMutation.isPending || !startTime || !endTime}
                        className="flex-1"
                        data-testid="button-save-slot"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingSlot(false);
                          setStartTime("");
                          setEndTime("");
                        }}
                        data-testid="button-cancel-slot"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
