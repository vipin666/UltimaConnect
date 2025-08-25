import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format, addDays } from "date-fns";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenityId: string;
  amenityName: string;
  amenityType: string;
}

export function BookingModal({ open, onOpenChange, amenityId, amenityName, amenityType }: BookingModalProps) {
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<{ startTime: string; endTime: string } | null>(null);
  const { toast } = useToast();

  const getTimeSlots = (type: string) => {
    switch (type) {
      case 'swimming_pool':
        return [
          { time: "6:00 AM", startTime: "06:00", endTime: "07:00", label: "6:00 - 7:00 AM" },
          { time: "7:00 AM", startTime: "07:00", endTime: "08:00", label: "7:00 - 8:00 AM" },
          { time: "8:00 AM", startTime: "08:00", endTime: "09:00", label: "8:00 - 9:00 AM" },
          { time: "9:00 AM", startTime: "09:00", endTime: "10:00", label: "9:00 - 10:00 AM" },
          { time: "6:00 PM", startTime: "18:00", endTime: "19:00", label: "6:00 - 7:00 PM" },
          { time: "7:00 PM", startTime: "19:00", endTime: "20:00", label: "7:00 - 8:00 PM" },
          { time: "8:00 PM", startTime: "20:00", endTime: "21:00", label: "8:00 - 9:00 PM" },
          { time: "9:00 PM", startTime: "21:00", endTime: "22:00", label: "9:00 - 10:00 PM" },
        ];
      case 'pool_table':
        return Array.from({ length: 12 }, (_, i) => {
          const hour = 9 + i;
          const displayHour = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          return {
            time: `${displayHour}:00 ${ampm}`,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
            label: `${displayHour}:00 - ${displayHour + 1 > 12 ? displayHour + 1 - 12 : displayHour + 1}:00 ${hour + 1 >= 12 ? 'PM' : 'AM'}`
          };
        });
      case 'party_hall':
        return [
          { time: "Full Day", startTime: "00:00", endTime: "23:59", label: "Full Day Booking" }
        ];
      case 'guest_parking':
        return Array.from({ length: 24 }, (_, i) => {
          const displayHour = i === 0 ? 12 : i > 12 ? i - 12 : i;
          const ampm = i >= 12 ? 'PM' : 'AM';
          return {
            time: `${displayHour}:00 ${ampm}`,
            startTime: `${i.toString().padStart(2, '0')}:00`,
            endTime: `${((i + 24) % 24).toString().padStart(2, '0')}:00`,
            label: `${displayHour}:00 ${ampm} - 24 hours`
          };
        });
      case 'gym':
        return Array.from({ length: 9 }, (_, i) => {
          const hour = 5 + i * 2;
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const endHour = hour + 2;
          const endDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
          const endAmpm = endHour >= 12 ? 'PM' : 'AM';
          return {
            time: `${displayHour}:00 ${ampm}`,
            startTime: `${hour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            label: `${displayHour}:00 ${ampm} - ${endDisplayHour}:00 ${endAmpm}`
          };
        });
      default:
        return [];
    }
  };

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: { amenityId: string; bookingDate: string; startTime: string; endTime: string }) => {
      return apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking confirmed successfully",
      });
      setSelectedSlot(null);
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create booking. The time slot might be unavailable.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast({
        title: "Error",
        description: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }
    
    createBookingMutation.mutate({
      amenityId,
      bookingDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });
  };

  const timeSlots = getTimeSlots(amenityType);
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {amenityName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="focus:ring-2 focus:ring-primary"
              data-testid="input-date"
            />
          </div>
          
          {timeSlots.length > 0 && (
            <div>
              <Label>Time Slot</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {timeSlots.map((slot, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                    className={`text-sm h-auto py-2 ${
                      selectedSlot?.startTime === slot.startTime 
                        ? 'bg-primary text-white' 
                        : 'hover:bg-primary hover:text-white'
                    }`}
                    onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                    data-testid={`button-slot-${index}`}
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
              {selectedSlot && (
                <p className="text-sm text-gray-600 mt-2" data-testid="text-selected-slot">
                  Selected: {timeSlots.find(s => s.startTime === selectedSlot.startTime)?.label}
                </p>
              )}
            </div>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBookingMutation.isPending || !selectedSlot}
              className="flex-1 bg-primary hover:bg-blue-700"
              data-testid="button-confirm"
            >
              {createBookingMutation.isPending ? "Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
