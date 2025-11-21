import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AvailabilitySlot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import Picker from "react-mobile-picker";

interface AvailabilityCalendarProps {
  coachId: string;
  isEditable?: boolean;
}

export function AvailabilityCalendar({ coachId, isEditable = false }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [startTime, setStartTime] = useState({ hour: "06", minute: "00" });
  const [endTime, setEndTime] = useState({ hour: "07", minute: "00" });
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
      setStartTime({ hour: "06", minute: "00" });
      setEndTime({ hour: "07", minute: "00" });
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
    const startTimeStr = `${startTime.hour}:${startTime.minute}`;
    const endTimeStr = `${endTime.hour}:${endTime.minute}`;
    
    if (selectedDateUnavailable) {
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

  const handleClearDay = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    clearDayMutation.mutate(dateStr);
  };

  const generateHours = () => {
    const hours: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      hours.push(hour.toString().padStart(2, "0"));
    }
    return hours;
  };

  const generateMinutes = () => {
    return ["00", "15", "30", "45"];
  };

  const hours = generateHours();
  const minutes = generateMinutes();
  const selectedDateSlots = selectedDate ? getAvailableSlots(selectedDate) : [];
  const selectedDateUnavailable = selectedDate ? isDateUnavailable(selectedDate) : false;
  const availableDates = getDatesWithAvailability();
  const unavailableDates = getDatesUnavailable();

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
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg">
              {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
            {isEditable && !selectedDateUnavailable && (
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
            {selectedDateUnavailable && !isEditable ? (
              <Badge variant="destructive" data-testid="badge-day-unavailable">
                Day Unavailable
              </Badge>
            ) : selectedDateUnavailable && isEditable ? (
              <div className="space-y-2">
                <Badge variant="destructive" data-testid="badge-day-unavailable">
                  Day Unavailable
                </Badge>
                <p className="text-sm text-muted-foreground">
                  This day is marked as unavailable. Remove the unavailable marker by adding time slots.
                </p>
              </div>
            ) : selectedDateSlots.length === 0 ? (
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
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Start Time</label>
                        <div className="border rounded-md bg-card" data-testid="picker-start-time">
                          <Picker
                            value={startTime}
                            onChange={setStartTime}
                            wheelMode="natural"
                            height={150}
                          >
                            <Picker.Column name="hour">
                              {hours.map((hour) => (
                                <Picker.Item key={hour} value={hour}>
                                  {hour}
                                </Picker.Item>
                              ))}
                            </Picker.Column>
                            <Picker.Column name="minute">
                              {minutes.map((minute) => (
                                <Picker.Item key={minute} value={minute}>
                                  {minute}
                                </Picker.Item>
                              ))}
                            </Picker.Column>
                          </Picker>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">End Time</label>
                        <div className="border rounded-md bg-card" data-testid="picker-end-time">
                          <Picker
                            value={endTime}
                            onChange={setEndTime}
                            wheelMode="natural"
                            height={150}
                          >
                            <Picker.Column name="hour">
                              {hours.map((hour) => (
                                <Picker.Item key={hour} value={hour}>
                                  {hour}
                                </Picker.Item>
                              ))}
                            </Picker.Column>
                            <Picker.Column name="minute">
                              {minutes.map((minute) => (
                                <Picker.Item key={minute} value={minute}>
                                  {minute}
                                </Picker.Item>
                              ))}
                            </Picker.Column>
                          </Picker>
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
                          setStartTime({ hour: "06", minute: "00" });
                          setEndTime({ hour: "07", minute: "00" });
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
