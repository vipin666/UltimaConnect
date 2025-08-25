import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, User, Phone, MapPin, CheckCircle, XCircle, MessageSquare, Eye } from "lucide-react";
import { format } from "date-fns";
import type { GuestNotificationWithUser } from "@shared/schema";

export function WatchmanDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: guestNotifications = [], isLoading } = useQuery<GuestNotificationWithUser[]>({
    queryKey: ['/api/guest-notifications'],
  });

  const approveGuestMutation = useMutation({
    mutationFn: async ({ notificationId, approved, notes }: { notificationId: string; approved: boolean; notes?: string }) => {
      return apiRequest('PATCH', `/api/guest-notifications/${notificationId}/approve`, { approved, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guest-notifications'] });
      toast({
        title: "Guest notification updated",
        description: "Guest status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update guest notification",
        variant: "destructive",
      });
    },
  });

  const handleApproveGuest = (notificationId: string, approved: boolean, notes?: string) => {
    approveGuestMutation.mutate({ notificationId, approved, notes });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-md">
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
        <h2 className="text-lg font-semibold mb-1">Watchman Dashboard</h2>
        <p className="text-blue-100 text-sm">Monitor guest arrivals and building security</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {guestNotifications.filter(g => g.watchmanApproved).length}
            </div>
            <div className="text-sm text-green-700">Approved Guests</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {guestNotifications.filter(g => !g.watchmanApproved && g.isActive).length}
            </div>
            <div className="text-sm text-orange-700">Pending Approval</div>
          </CardContent>
        </Card>
      </div>

      {/* Guest Notifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Active Guest Notifications</h3>
        
        {guestNotifications.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active guest notifications</h3>
              <p className="text-gray-600">All guests have been processed or no new arrivals</p>
            </CardContent>
          </Card>
        ) : (
          guestNotifications.map((notification) => (
            <Card key={notification.id} className="shadow-md border border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{notification.guestName}</h4>
                      <p className="text-sm text-gray-500">
                        Visiting Unit {notification.user.unitNumber} • {notification.user.firstName} {notification.user.lastName}
                      </p>
                    </div>
                  </div>
                  
                  {notification.watchmanApproved ? (
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {notification.guestPhone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {notification.guestPhone}
                    </div>
                  )}
                  
                  {notification.purpose && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {notification.purpose}
                    </div>
                  )}
                  
                  {notification.arrivalTime && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Expected: {format(new Date(notification.arrivalTime), 'MMM d, h:mm a')}
                    </div>
                  )}

                  {notification.parkingSlot && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      Parking: Slot {notification.parkingSlot}
                    </div>
                  )}
                </div>

                {notification.watchmanNotes && (
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {notification.watchmanNotes}
                    </p>
                  </div>
                )}

                {!notification.watchmanApproved && notification.isActive && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleApproveGuest(notification.id, true, "Guest approved by watchman")}
                      disabled={approveGuestMutation.isPending}
                      className="flex-1 bg-green-600 text-white hover:bg-green-700"
                      data-testid={`button-approve-${notification.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Entry
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleApproveGuest(notification.id, false, "Entry denied by watchman")}
                      disabled={approveGuestMutation.isPending}
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                      data-testid={`button-deny-${notification.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Deny Entry
                    </Button>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-3">
                  Notification created: {format(new Date(notification.createdAt!), 'MMM d, yyyy h:mm a')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}