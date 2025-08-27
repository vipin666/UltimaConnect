import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format, addDays } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();

  // Fetch available slots for the selected date
  const { data: availableSlotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['/api/bookings/available-slots', amenityId, bookingDate],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/available-slots?amenityId=${amenityId}&date=${bookingDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch available slots');
      }
      return response.json();
    },
    enabled: open && !!amenityId && !!bookingDate,
  });

  // Fetch user's existing guest parking bookings for validation display
  const { data: userBookings = [] } = useQuery({
    queryKey: ['/api/bookings/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/user/${user?.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user bookings');
      }
      return response.json();
    },
    enabled: open && !!user?.id && amenityType === 'guest_parking',
  });

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [bookingDate]);

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
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      
      // Handle specific validation errors
      if (error?.errorType === 'consecutive_days_limit') {
        toast({
          title: "Booking Limit Exceeded",
          description: error.message || "You can only book guest parking for a maximum of 2 consecutive days.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error?.message || "Failed to create booking. The time slot might be unavailable.",
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

    // Frontend validation for guest parking consecutive days
    if (amenityType === 'guest_parking' && userBookings.length > 0) {
      const guestParkingBookings = userBookings.filter((booking: any) => 
        booking.amenityType === 'guest_parking' && 
        (booking.status === 'confirmed' || booking.status === 'pending')
      );
      
      if (guestParkingBookings.length > 0) {
        const bookingDates = guestParkingBookings.map((booking: any) => booking.bookingDate);
        const requestedDate = new Date(bookingDate);
        
        // Check if this would create more than 2 consecutive days
        const allDates = [...bookingDates, bookingDate].sort();
        const uniqueDates = Array.from(new Set(allDates));
        
        let maxConsecutive = 1;
        let currentConsecutive = 1;
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const diffTime = currDate.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentConsecutive++;
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
          } else {
            currentConsecutive = 1;
          }
        }
        
        if (maxConsecutive > 2) {
          toast({
            title: "Booking Limit Exceeded",
            description: `You can only book guest parking for a maximum of 2 consecutive days. This booking would create ${maxConsecutive} consecutive days.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    createBookingMutation.mutate({
      amenityId,
      bookingDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
    });
  };

  const availableSlots = availableSlotsData?.availableSlots || [];
  const bookedSlots = availableSlotsData?.bookedSlots || [];
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const minDate = format(new Date(), 'yyyy-MM-dd');
  const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {amenityName}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Parking Rules */}
          {amenityType === 'guest_parking' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Guest Parking Rules</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Available for 24 hours (full day booking)</li>
                <li>• Maximum 2 consecutive days per user</li>
                <li>• First come, first served basis</li>
              </ul>
            </div>
          )}

          {/* User's Current Guest Parking Bookings */}
          {amenityType === 'guest_parking' && userBookings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Your Current Guest Parking Bookings</h4>
              <div className="space-y-1">
                {userBookings
                  .filter((booking: any) => booking.amenityType === 'guest_parking' && (booking.status === 'confirmed' || booking.status === 'pending'))
                  .slice(0, 3)
                  .map((booking: any, index: number) => (
                    <div key={booking.id} className="text-xs text-yellow-700">
                      {new Date(booking.bookingDate).toLocaleDateString()} - {booking.amenityName} ({booking.status})
                    </div>
                  ))}
                {userBookings.filter((booking: any) => booking.amenityType === 'guest_parking' && (booking.status === 'confirmed' || booking.status === 'pending')).length > 3 && (
                  <div className="text-xs text-yellow-600 font-medium">
                    +{userBookings.filter((booking: any) => booking.amenityType === 'guest_parking' && (booking.status === 'confirmed' || booking.status === 'pending')).length - 3} more bookings
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Parking Bookings for Selected Date */}
          {amenityType === 'guest_parking' && bookedSlots.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">Guest Parking Bookings for {new Date(bookingDate).toLocaleDateString()}</h4>
              <div className="space-y-2">
                {bookedSlots.map((slot: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-red-700 font-medium">Slot {index + 1}</span>
                    </div>
                    <span className="text-red-600">
                      {slot.bookedBy || 'Unknown User'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2">
                {bookedSlots.length === 3 ? 'All guest parking slots are booked for this date.' : `${3 - bookedSlots.length} slot(s) still available.`}
              </p>
            </div>
          )}
          
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
          
          {/* Booking Summary for Admins */}
          {isAdmin && (availableSlots.length > 0 || bookedSlots.length > 0) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Booking Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                <div>
                  <span className="font-medium">Available:</span> {availableSlots.length} slots
                </div>
                <div>
                  <span className="font-medium">Booked:</span> {bookedSlots.length} slots
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>
              {amenityType === 'guest_parking' ? 'Booking Period' : 'Time Slots'}
            </Label>
            {slotsLoading ? (
              <div className="mt-2 text-sm text-gray-500">Loading available slots...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableSlots.map((slot: any, index: number) => (
                    <Button
                      key={index}
                      type="button"
                      variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                      className={`text-sm h-auto py-2 ${
                        selectedSlot?.startTime === slot.startTime 
                          ? 'bg-green-600 text-white' 
                          : 'hover:bg-green-600 hover:text-white border-green-200'
                      }`}
                      onClick={() => setSelectedSlot({ startTime: slot.startTime, endTime: slot.endTime })}
                      data-testid={`button-slot-${index}`}
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
                
                {/* Show booked slots */}
                {bookedSlots.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600">Booked Slots:</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {bookedSlots.map((slot: any, index: number) => (
                        <div
                          key={index}
                          className="text-sm py-2 px-3 bg-red-500 text-white rounded border text-center cursor-not-allowed"
                          title={slot.bookedBy ? `Booked by: ${slot.bookedBy}` : 'This slot is already booked'}
                        >
                          <div className="font-medium">
                            {amenityType === 'guest_parking' ? 'Full Day' : `${slot.startTime} - ${slot.endTime}`}
                          </div>
                          {slot.bookedBy && (
                            <div className="text-xs opacity-90">
                              {isAdmin ? `Booked by: ${slot.bookedBy}` : `Booked by: ${slot.bookedBy}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedSlot && (
                  <p className="text-sm text-green-600 mt-2 font-medium" data-testid="text-selected-slot">
                    Selected: {availableSlots.find((s: any) => s.startTime === selectedSlot.startTime)?.label}
                    {amenityType === 'guest_parking' && (
                      <span className="block text-xs text-gray-600 mt-1">
                        This is a full-day booking (24 hours)
                      </span>
                    )}
                  </p>
                )}
                
                {availableSlots.length === 0 && bookedSlots.length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 font-medium">
                      All slots are booked for this date.
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-red-500 mt-1">
                        Click "Manage All Bookings" to view and manage existing bookings.
                      </p>
                    )}
                  </div>
                )}
                
                {availableSlots.length === 0 && bookedSlots.length === 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    No slots available for this date. Please select another date.
                  </p>
                )}
              </>
            )}
          </div>
          
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
              {createBookingMutation.isPending ? "Booking..." : isAdmin ? "Confirm Booking" : "Request Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
