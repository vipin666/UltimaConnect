import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Building, Bell, User } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { PostCard } from "../community/PostCard";
import { PostModal } from "../community/PostModal";
import { BookingCard } from "../bookings/BookingCard";
import { BookingModal } from "../bookings/BookingModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, AlertTriangle, Calendar, Settings } from "lucide-react";
import type { PostWithAuthor, Amenity, BookingWithAmenity } from "@shared/schema";
import { format } from "date-fns";

export function MobileLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('community');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<{ id: string; name: string; type: string } | null>(null);
  const { toast } = useToast();

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts'],
    enabled: activeTab === 'community',
  });

  const { data: amenities, isLoading: amenitiesLoading } = useQuery<Amenity[]>({
    queryKey: ['/api/amenities'],
    enabled: activeTab === 'bookings',
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithAmenity[]>({
    queryKey: ['/api/bookings'],
    enabled: activeTab === 'bookings',
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('POST', `/api/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
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
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest('PATCH', `/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });
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
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  const handleLike = (postId: string) => {
    likePostMutation.mutate(postId);
  };

  const handleComment = (postId: string) => {
    // TODO: Implement comment functionality
    toast({
      title: "Coming Soon",
      description: "Comment feature will be available soon",
    });
  };

  const handleBookAmenity = (amenityId: string, amenityType: string) => {
    const amenity = amenities?.find((a: Amenity) => a.id === amenityId);
    if (amenity) {
      setSelectedAmenity({ id: amenityId, name: amenity.name, type: amenityType });
      setShowBookingModal(true);
    }
  };

  const renderCommunityTab = () => (
    <div className="space-y-4 pb-20">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 px-4">
        <Button 
          onClick={() => setShowPostModal(true)}
          className="bg-accent text-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-orange-600 h-16"
          data-testid="button-new-post"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-medium">New Post</span>
        </Button>
        <Button 
          variant="outline"
          className="border-2 border-red-500 text-red-500 p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-red-50 h-16"
          data-testid="button-complaints"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">Complaints</span>
        </Button>
      </div>

      {/* Community Feed */}
      <div className="space-y-4 px-4">
        <h2 className="text-lg font-medium text-gray-800" data-testid="text-community-feed">Community Feed</h2>
        
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-material">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-16 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <Card className="shadow-material">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-4">Be the first to share something with your community!</p>
              <Button onClick={() => setShowPostModal(true)} data-testid="button-create-first-post">
                Create Your First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          posts?.map((post: PostWithAuthor) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              isLiking={likePostMutation.isPending}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-6 pb-20 px-4">
      <h2 className="text-lg font-medium text-gray-800" data-testid="text-amenity-bookings">Amenity Bookings</h2>
      
      {/* Booking Options */}
      <div className="space-y-4">
        {amenitiesLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-material">
                <CardContent className="p-4">
                  <div className="animate-pulse flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-300 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          amenities?.map((amenity: Amenity) => (
            <BookingCard
              key={amenity.id}
              amenity={amenity}
              onBook={handleBookAmenity}
            />
          ))
        )}
      </div>

      {/* Current Bookings */}
      <div>
        <h3 className="text-md font-medium text-gray-800 mb-3" data-testid="text-current-bookings">Your Current Bookings</h3>
        {bookingsLoading ? (
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ) : bookings?.length === 0 ? (
          <Card className="shadow-material">
            <CardContent className="p-6 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600" data-testid="text-no-bookings">No current bookings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings?.map((booking: BookingWithAmenity) => (
              <Card key={booking.id} className="border border-green-200 bg-green-50" data-testid={`booking-${booking.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800" data-testid={`text-booking-name-${booking.id}`}>
                        {booking.amenity.name}
                      </h4>
                      <p className="text-green-600 text-sm" data-testid={`text-booking-time-${booking.id}`}>
                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')} • {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">
                        {booking.status}
                      </Badge>
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelBookingMutation.mutate(booking.id)}
                          disabled={cancelBookingMutation.isPending}
                          className="text-red-600 hover:text-red-800 text-xs"
                          data-testid={`button-cancel-${booking.id}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderServicesTab = () => (
    <div className="space-y-6 pb-20 px-4">
      <h2 className="text-lg font-medium text-gray-800">Building Services</h2>
      
      {/* Admin Panel (Conditional) */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <Card className="shadow-material border-l-4 border-secondary">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Admin Panel</span>
            </h3>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="w-full bg-secondary text-white hover:bg-green-700"
              data-testid="button-admin-panel"
            >
              Access Admin Panel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts */}
      <Card className="shadow-material">
        <CardContent className="p-4">
          <h3 className="font-medium text-gray-800 mb-3">Emergency Contacts</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-primary text-sm font-medium">S</span>
                </div>
                <span className="text-sm">Security Desk</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = 'tel:+1234567890'}
                data-testid="button-call-security"
              >
                Call
              </Button>
            </div>
            <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="text-secondary text-sm font-medium">M</span>
                </div>
                <span className="text-sm">Maintenance</span>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.location.href = 'tel:+1234567891'}
                data-testid="button-call-maintenance"
              >
                Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6" />
            <div>
              <h1 className="font-medium text-lg">Ultima Skymax</h1>
              <p className="text-blue-100 text-xs" data-testid="text-user-info">
                {user.unitNumber ? `Unit ${user.unitNumber}` : user.role} - {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 rounded-full hover:bg-blue-600 text-white"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/api/logout'}
              className="p-2 rounded-full hover:bg-blue-600 text-white"
              data-testid="button-logout"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'community' && renderCommunityTab()}
        {activeTab === 'bookings' && renderBookingsTab()}
        {activeTab === 'services' && renderServicesTab()}
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <PostModal open={showPostModal} onOpenChange={setShowPostModal} />
      
      {selectedAmenity && (
        <BookingModal
          open={showBookingModal}
          onOpenChange={setShowBookingModal}
          amenityId={selectedAmenity.id}
          amenityName={selectedAmenity.name}
          amenityType={selectedAmenity.type}
        />
      )}
    </div>
  );
}
