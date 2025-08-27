import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Calendar, Clock, User, X, CheckCircle, XCircle } from "lucide-react";

interface Booking {
  id: string;
  userId: string;
  amenityId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  unitNumber?: string;
  amenityName?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    unitNumber: string;
  };
  amenity?: {
    id: string;
    name: string;
    type: string;
  };
}

interface BookingManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
}

export function BookingManagementModal({ open, onOpenChange, bookings }: BookingManagementModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/cancel`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/available-slots'] });
      toast({
        title: "Booking cancelled",
        description: "The booking has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Approve booking mutation (for admins)
  const approveBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/available-slots'] });
      toast({
        title: "Booking approved",
        description: "The booking has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to approve booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject booking mutation (for admins)
  const rejectBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/available-slots'] });
      setSelectedBooking(null);
      setRejectReason("");
      toast({
        title: "Booking rejected",
        description: "The booking has been rejected and the slot is now available.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to reject booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    );
  };

  const handleReject = () => {
    if (!selectedBooking) return;
    
    rejectBookingMutation.mutate({
      bookingId: selectedBooking.id,
      reason: rejectReason || undefined
    });
  };

  const filteredBookings = bookings.filter(booking => 
    booking.status === 'confirmed' || booking.status === 'pending'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Bookings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No active bookings to manage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-lg">
                          {booking.amenityName || 'Unknown Amenity'}
                        </h4>
                        {getStatusBadge(booking.status)}
                      </div>
                      
                                             <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                         <div className="flex items-center gap-2">
                           <Calendar className="w-4 h-4" />
                           <span>{format(new Date(booking.bookingDate), 'MMM dd, yyyy')}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Clock className="w-4 h-4" />
                           <span>{booking.startTime} - {booking.endTime}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <User className="w-4 h-4" />
                           <span>
                             {booking.firstName} {booking.lastName} 
                             {booking.unitNumber && ` (${booking.unitNumber})`}
                           </span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                             ID: {booking.id.slice(-8)}
                           </span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* Approval buttons - only for admins on pending bookings */}
                      {isAdmin && booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveBookingMutation.mutate(booking.id)}
                            disabled={approveBookingMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      
                      {/* Cancel button - available to booking owner or admins for confirmed bookings */}
                      {(user?.id === booking.userId || isAdmin) && booking.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reject Confirmation Dialog */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Reject Booking</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to reject this booking? The time slot will become available for others.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBooking(null);
                    setRejectReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={rejectBookingMutation.isPending}
                >
                  {rejectBookingMutation.isPending ? "Rejecting..." : "Reject Booking"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
