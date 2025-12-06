import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Check } from "lucide-react";
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
  const [startHour, setStartHour] = useState("9");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endHour, setEndHour] = useState("10");
  const [endMinute, setEndMinute] = useState("00");
  const [endPeriod, setEndPeriod] = useState("AM");
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
      resetTimeInputs();
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

  const resetTimeInputs = () => {
    setStartHour("9");
    setStartMinute("00");
    setStartPeriod("AM");
    setEndHour("10");
    setEndMinute("00");
    setEndPeriod("AM");
  };

  const isSlotUnavailable = (slot: AvailabilitySlot) => {
    return slot.startTime === "UNAVAILABLE" && slot.endTime === "UNAVAILABLE";
  };

  const getDateSlots = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return slots.filter((slot) => slot.date === dateStr);
  };

  const isDateUnavailable = (date: Date) => {
    const dateSlots = getDateSlots(date);
    return dateSlots.some(slot => isSlotUnavailable(slot));
  };

  const getAvailableSlots = (date: Date) => {
    const dateSlots = getDateSlots(date);
    return dateSlots.filter(slot => !isSlotUnavailable(slot));
  };

  const getDatesWithAvailability = () => {
    const availableSlots = slots.filter(slot => !isSlotUnavailable(slot));
    const datesSet = new Set(availableSlots.map((slot) => slot.date));
    return Array.from(datesSet).map((dateStr) => parseISO(dateStr));
  };

  const getDatesUnavailable = () => {
    const unavailableSlots = slots.filter(slot => isSlotUnavailable(slot));
    const datesSet = new Set(unavailableSlots.map((slot) => slot.date));
    return Array.from(datesSet).map((dateStr) => parseISO(dateStr));
  };

  const convertTo24Hour = (hour: string, period: string): string => {
    let h = parseInt(hour);
    if (period === "PM" && h !== 12) {
      h += 12;
    } else if (period === "AM" && h === 12) {
      h = 0;
    }
    return h.toString().padStart(2, "0");
  };

  const formatTimeDisplay = (time: string): string => {
    const [hours, minutes] = time.split(":");
    let h = parseInt(hours);
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${minutes} ${period}`;
  };

  const handleAddSlot = async () => {
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const start24 = convertTo24Hour(startHour, startPeriod);
    const end24 = convertTo24Hour(endHour, endPeriod);
    const startTimeStr = `${start24}:${startMinute}`;
    const endTimeStr = `${end24}:${endMinute}`;

    if (startTimeStr >= endTimeStr) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    const isCurrentDateUnavailable = isDateUnavailable(selectedDate);
    if (isCurrentDateUnavailable) {
      const dateSlots = getDateSlots(selectedDate);
      const unavailableSlot = dateSlots.find(slot => isSlotUnavailable(slot));
      if (unavailableSlot) {
        await deleteSlotMutation.mutateAsync(unavailableSlot.id);
      }
    }
    
    createSlotMutation.mutate({
      coachId,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
  };

  const handleMarkUnavailable = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    clearDayMutation.mutate(dateStr);
  };

  const handleMakeAvailable = async () => {
    if (!selectedDate) return;
    const dateSlots = getDateSlots(selectedDate);
    const unavailableSlot = dateSlots.find(slot => isSlotUnavailable(slot));
    if (unavailableSlot) {
      await deleteSlotMutation.mutateAsync(unavailableSlot.id);
      toast({
        title: "Success",
        description: "Day is now available for booking",
      });
    }
  };

  const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const minutes = ["00", "15", "30", "45"];
  const selectedDateSlots = selectedDate ? getAvailableSlots(selectedDate) : [];
  const selectedDateUnavailable = selectedDate ? isDateUnavailable(selectedDate) : false;
  const availableDates = getDatesWithAvailability();
  const unavailableDates = getDatesUnavailable();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                available: availableDates,
                unavailable: unavailableDates,
              }}
              modifiersStyles={{
                available: {
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                  fontWeight: "bold",
                },
                unavailable: {
                  backgroundColor: "hsl(var(--destructive) / 0.1)",
                  color: "hsl(var(--destructive))",
                  fontWeight: "bold",
                  textDecoration: "line-through",
                },
              }}
              data-testid="calendar-availability"
            />
          </div>

          <div className="space-y-4">
            {selectedDate && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </h3>
                  {isEditable && (
                    selectedDateUnavailable ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleMakeAvailable}
                        disabled={deleteSlotMutation.isPending}
                        data-testid="button-make-available"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Make Available
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleMarkUnavailable}
                        disabled={clearDayMutation.isPending}
                        data-testid="button-mark-unavailable"
                      >
                        Mark Unavailable
                      </Button>
                    )
                  )}
                </div>

                {selectedDateUnavailable ? (
                  <div className="p-4 border rounded-md bg-destructive/5">
                    <Badge variant="destructive" data-testid="badge-day-unavailable">
                      Day Unavailable
                    </Badge>
                    {isEditable && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Click "Make Available" to allow bookings for this day.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Time Slots</h4>
                    {selectedDateSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-no-slots">
                        No time slots set for this day
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
                              {formatTimeDisplay(slot.startTime)} - {formatTimeDisplay(slot.endTime)}
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
                  </div>
                )}

                {isEditable && !selectedDateUnavailable && (
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
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Start Time</label>
                            <div className="flex gap-2">
                              <Select value={startHour} onValueChange={setStartHour}>
                                <SelectTrigger className="w-20" data-testid="select-start-hour">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[160px]">
                                  {hours.map((hour) => (
                                    <SelectItem key={hour} value={hour}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="flex items-center">:</span>
                              <Select value={startMinute} onValueChange={setStartMinute}>
                                <SelectTrigger className="w-20" data-testid="select-start-minute">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[160px]">
                                  {minutes.map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={startPeriod} onValueChange={setStartPeriod}>
                                <SelectTrigger className="w-20" data-testid="select-start-period">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">End Time</label>
                            <div className="flex gap-2">
                              <Select value={endHour} onValueChange={setEndHour}>
                                <SelectTrigger className="w-20" data-testid="select-end-hour">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[160px]">
                                  {hours.map((hour) => (
                                    <SelectItem key={hour} value={hour}>
                                      {hour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <span className="flex items-center">:</span>
                              <Select value={endMinute} onValueChange={setEndMinute}>
                                <SelectTrigger className="w-20" data-testid="select-end-minute">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-[160px]">
                                  {minutes.map((minute) => (
                                    <SelectItem key={minute} value={minute}>
                                      {minute}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={endPeriod} onValueChange={setEndPeriod}>
                                <SelectTrigger className="w-20" data-testid="select-end-period">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddSlot}
                            disabled={createSlotMutation.isPending}
                            className="flex-1"
                            data-testid="button-save-slot"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAddingSlot(false);
                              resetTimeInputs();
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
              </>
            )}

            {!selectedDate && (
              <p className="text-sm text-muted-foreground">
                Select a date to view or manage time slots
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
