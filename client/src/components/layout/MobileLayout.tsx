import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Building, Bell, User } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { PostCard } from "../community/PostCard";
import { PostModal } from "../community/PostModal";
import { Comments } from "../community/Comments";
import { BookingCard } from "../bookings/BookingCard";
import { BookingModal } from "../bookings/BookingModal";
import { WatchmanDashboard } from "../watchman/WatchmanDashboard";
import { AdminDashboard } from "../admin/AdminDashboard";
import { MobileAdminDashboard } from "../admin/MobileAdminDashboard";
import { MessagingTab } from "../messaging/MessagingTab";
import { BiometricAccessTab } from "../access/BiometricAccessTab";
import { TenantDocumentsTab } from "../documents/TenantDocumentsTab";
import { BookingReportsTab } from "../admin/BookingReportsTab";
import { VisitorsTab } from "../visitors/VisitorsTab";
import { BookingManagementModal } from "../bookings/BookingManagementModal";
import { CommitteeMembers } from "../committee/CommitteeMembers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, AlertTriangle, Calendar, Settings, Fingerprint, FileText, BarChart3, DollarSign, Users, Wrench, Home, MessageSquare, Shield, UserCheck, Building2 } from "lucide-react";
import type { PostWithAuthor, Amenity, BookingWithAmenity } from "@shared/schema";
import { format } from "date-fns";

export function MobileLayout() {
  const { user } = useAuth();
  
  // Set default tab based on user role
  const getDefaultTab = () => {
    if (!user) return 'home';
    switch (user.role) {
      case 'watchman': return 'home';
      case 'admin':
      case 'super_admin': return 'home';
      default: return 'home';
    }
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [activeServiceTab, setActiveServiceTab] = useState<string>('overview');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingManagementModal, setShowBookingManagementModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<{ id: string; name: string; type: string } | null>(null);
  const [showRecentPosts, setShowRecentPosts] = useState(true);
  const [showRecentBookings, setShowRecentBookings] = useState(true);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showServicesDialog, setShowServicesDialog] = useState(false);
  const { toast } = useToast();

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts'],
    enabled: activeTab === 'community' || activeTab === 'home',
  });

  const { data: amenities, isLoading: amenitiesLoading } = useQuery<Amenity[]>({
    queryKey: ['/api/amenities'],
    enabled: activeTab === 'bookings',
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithAmenity[]>({
    queryKey: ['/api/bookings'],
    enabled: activeTab === 'bookings' || activeTab === 'home' || (user?.role === 'admin' || user?.role === 'super_admin'),
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery<any[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      return response.json();
    },
    enabled: (user?.role === 'admin' || user?.role === 'super_admin') && (activeTab === 'home' || activeTab === 'admin'),
  });

  const { data: biometricRequests, isLoading: biometricLoading } = useQuery<any[]>({
    queryKey: ['/api/biometric-requests'],
    queryFn: async () => {
      const response = await fetch('/api/biometric-requests');
      return response.json();
    },
    enabled: (user?.role === 'admin' || user?.role === 'super_admin') && (activeTab === 'home' || activeTab === 'admin'),
  });

  const { data: services, isLoading: servicesLoading } = useQuery<any[]>({
    queryKey: ['/api/services'],
    queryFn: async () => {
      const response = await fetch('/api/services');
      return response.json();
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest('POST', `/api/posts/${postId}/like`, {});
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'like-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts', postId, 'likes'] });
    },
    onError: (error) => {
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
          window.location.href = "/login";
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
    setCommentPostId(postId);
  };

  const handleBookAmenity = (amenityId: string, amenityType: string) => {
    const amenity = amenities?.find((a: Amenity) => a.id === amenityId);
    if (amenity) {
      setSelectedAmenity({ id: amenityId, name: amenity.name, type: amenityType });
      setShowBookingModal(true);
    }
  };

  const renderHomeTab = () => (
    <div className="space-y-4 pb-20">
      {/* Welcome Section */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to Ultima Skymax</h2>
              <p className="text-blue-100">Your smart community hub</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">
            Hello {user?.firstName} {user?.lastName}! Welcome to your community dashboard.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 px-4 mb-6">
        <Button 
          onClick={() => setActiveTab('community')}
          className="bg-accent text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-orange-600 transition-colors h-20"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Community</span>
        </Button>
        <Button 
          onClick={() => setActiveTab('bookings')}
          variant="outline"
          className="border-2 border-blue-500 text-blue-500 p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-blue-50 transition-colors h-20"
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm font-medium">Bookings</span>
        </Button>
      </div>

      {/* Role-specific Quick Actions */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="px-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Admin Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setActiveTab('admin')}
              className="bg-green-600 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-green-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Admin Panel</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/financial'}
              className="bg-blue-600 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">Financial</span>
            </Button>
          </div>
        </div>
      )}

      {/* Priority Actions for Admin Users */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="px-4 mb-6">
          {(Array.isArray(bookings) && bookings.filter(book => book.status === 'pending').length > 0) || 
           (Array.isArray(complaints) && complaints.filter(complaint => complaint.status === 'active').length > 0) || 
           (Array.isArray(biometricRequests) && biometricRequests.filter(req => req.status === 'pending').length > 0) ? (
            <Card className="shadow-md border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-orange-800 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Priority Actions Required</span>
                    <Badge className="bg-orange-200 text-orange-800">
                      {((Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').length : 0) + 
                        (Array.isArray(complaints) ? complaints.filter(complaint => complaint.status === 'active').length : 0) + 
                        (Array.isArray(biometricRequests) ? biometricRequests.filter(req => req.status === 'pending').length : 0))} New Requests
                    </Badge>
                  </h3>
                </div>
                <div className="space-y-3">
                  {/* Pending Bookings */}
                  {Array.isArray(bookings) && bookings.filter(book => book.status === 'pending').length > 0 && (
                    <div className="p-3 bg-white border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span>Pending Bookings ({bookings.filter(book => book.status === 'pending').length})</span>
                          </h4>
                          <p className="text-sm text-gray-600">Require approval</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setActiveTab('admin');
                            sessionStorage.setItem('adminTargetTab', 'actions');
                          }}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Active Complaints */}
                  {Array.isArray(complaints) && complaints.filter(complaint => complaint.status === 'active').length > 0 && (
                    <div className="p-3 bg-white border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>Active Complaints ({complaints.filter(complaint => complaint.status === 'active').length})</span>
                          </h4>
                          <p className="text-sm text-gray-600">Require resolution</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setActiveTab('admin');
                            sessionStorage.setItem('adminTargetTab', 'complaints');
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Pending Biometric Requests */}
                  {Array.isArray(biometricRequests) && biometricRequests.filter(req => req.status === 'pending').length > 0 && (
                    <div className="p-3 bg-white border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800 flex items-center space-x-2">
                            <Fingerprint className="w-4 h-4 text-blue-600" />
                            <span>Biometric Requests ({biometricRequests.filter(req => req.status === 'pending').length})</span>
                          </h4>
                          <p className="text-sm text-gray-600">Require approval</p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setActiveTab('admin');
                            // Store the target tab in sessionStorage for admin dashboard to read
                            sessionStorage.setItem('adminTargetTab', 'pending');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <UserCheck className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">All Clear! No pending requests</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {user?.role === 'watchman' && (
        <div className="px-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Watchman Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={() => setActiveTab('watchman')}
              className="bg-green-600 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-green-700 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="text-xs">Dashboard</span>
            </Button>
            <Button 
              onClick={() => setActiveTab('visitors')}
              className="bg-blue-600 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-blue-700 transition-colors"
            >
              <UserCheck className="w-5 h-5" />
              <span className="text-xs">Visitors</span>
            </Button>
          </div>
        </div>
      )}

      {/* Committee Members for Normal Users */}
      {user?.role === 'resident' && <CommitteeMembers />}

      {/* Quick Status Cards for Residents */}
      {user?.role === 'resident' && (
        <div className="px-4 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Quick Status</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* Posts Count */}
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{posts?.length || 0}</p>
                <p className="text-xs text-gray-600">Posts</p>
              </CardContent>
            </Card>

            {/* Bookings Count */}
            <Card className="shadow-md">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{Array.isArray(bookings) ? bookings.length : 0}</p>
                <p className="text-xs text-gray-600">Bookings</p>
              </CardContent>
            </Card>

            {/* Nearby Services Count - Clickable */}
            <Dialog open={showServicesDialog} onOpenChange={setShowServicesDialog}>
              <DialogTrigger asChild>
                <Card className="shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 text-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Building2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{services?.length || 0}</p>
                    <p className="text-xs text-gray-600">Nearby</p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Nearby Services</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {servicesLoading ? (
                    <div className="text-center py-4">Loading services...</div>
                  ) : services && services.length > 0 ? (
                    services.map((service: any) => (
                      <Card key={service.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-lg">{service.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {service.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                              <div className="flex items-center gap-2 mb-2 text-sm">
                                <span className="text-muted-foreground">📍 {service.address}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{service.phone}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(`tel:${service.phone}`, '_self')}
                                >
                                  Call
                                </Button>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                Distance: {service.distanceKm} km
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No services available
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Recent Posts */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800">Recent Posts</h3>
          <div className="flex items-center gap-2">
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowRecentPosts(!showRecentPosts)}
                className="text-gray-700"
                data-testid="button-toggle-recent-posts"
              >
                {showRecentPosts ? 'Collapse' : 'Expand'}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('community')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>
        </div>
        {postsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-12 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm">No posts yet</p>
              <Button 
                size="sm" 
                onClick={() => setShowPostModal(true)}
                className="mt-2"
              >
                Create First Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          showRecentPosts && (
            <div className="space-y-3">
              {posts?.slice(0, 3).map((post: PostWithAuthor) => (
                <Card key={post.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium text-sm">
                          {post.author?.firstName?.charAt(0)}{post.author?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">
                            {post.author?.firstName} {post.author?.lastName}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {post.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Flat {post.author?.unitNumber || 'Unknown'}
                        </p>
                        <h4 className="font-medium text-sm mb-1">{post.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{post?.createdAt ? format(new Date(String(post.createdAt)), 'MMM dd, yyyy') : ''}</span>
                          <span>{post.likes ?? 0} likes</span>
                          <span>{post.comments?.length ?? 0} comments</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Recent Bookings */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-800">Recent Bookings</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRecentBookings(!showRecentBookings)}
              className="text-gray-700"
              data-testid="button-toggle-recent-bookings"
            >
              {showRecentBookings ? 'Collapse' : 'Expand'}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('bookings')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>
        </div>
        {bookingsLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings?.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No bookings yet</p>
            </CardContent>
          </Card>
        ) : (
          showRecentBookings && (
            <div className="space-y-3">
              {bookings?.filter((booking: any) => booking && booking.id).slice(0, 3).map((booking: any) => (
                <Card key={booking.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{booking.amenityName || 'Unknown Amenity'}</h4>
                          <p className="text-sm text-gray-600">
                            {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM dd, yyyy') : 'Date not available'} • {booking.startTime || '00:00'} - {booking.endTime || '00:00'}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {booking.status || 'confirmed'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

      {/* Recent Maintenance Requests (for admins) */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-800">Recent Maintenance Requests</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveTab('admin')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Maintenance Dashboard</p>
                    <p className="text-sm text-gray-600">View and manage maintenance requests</p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setActiveTab('admin')}
                    variant="outline"
                  >
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );

  const renderCommunityTab = () => (
    <div className="space-y-4 pb-20">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 px-4 mb-6">
        <Button 
          onClick={() => setShowPostModal(true)}
          className="bg-accent text-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-orange-600 transition-colors h-20"
          data-testid="button-new-post"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">New Post</span>
        </Button>
        <Button 
          variant="outline"
          className="border-2 border-red-500 text-red-500 p-4 rounded-xl shadow-md flex flex-col items-center justify-center gap-2 hover:bg-red-50 transition-colors h-20"
          data-testid="button-complaints"
        >
          <AlertTriangle className="w-6 h-6" />
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800" data-testid="text-amenity-bookings">Amenity Bookings</h2>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBookingManagementModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Manage All Bookings
          </Button>
        )}
      </div>
      
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
            {bookings?.filter((booking: any) => booking && booking.id).map((booking: any) => (
              <Card key={booking.id} className="border border-green-200 bg-green-50" data-testid={`booking-${booking.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800" data-testid={`text-booking-name-${booking.id}`}>
                        {booking.amenityName || 'Unknown Amenity'}
                      </h4>
                      <p className="text-green-600 text-sm" data-testid={`text-booking-time-${booking.id}`}>
                        {booking.bookingDate ? format(new Date(booking.bookingDate), 'MMM d, yyyy') : 'Date not available'} • {booking.startTime || '00:00'} - {booking.endTime || '00:00'}
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        Booked by: {booking.firstName} {booking.lastName} {booking.unitNumber && `(${booking.unitNumber})`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }>
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
                      {booking.status === 'pending' && (
                        <span className="text-xs text-yellow-600">
                          Awaiting approval
                        </span>
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

  const renderServicesTab = () => {
    // Define service tabs based on user role
    const getServiceTabs = () => {
      const baseTabs = [
        { id: 'overview', label: 'Overview', icon: Settings },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'biometric', label: 'Biometric', icon: Fingerprint },
        { id: 'documents', label: 'Documents', icon: FileText },
      ];

      // Add reports tab for admins
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        baseTabs.push({ id: 'reports', label: 'Reports', icon: BarChart3 });
      }

      return baseTabs;
    };

    const serviceTabs = getServiceTabs();

    return (
      <div className="pb-24">
        {/* Service Tab Navigation */}
        <div className="sticky top-0 bg-white z-10 border-b">
          <div className="flex overflow-x-auto px-4 py-2">
            {serviceTabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                onClick={() => setActiveServiceTab(id)}
                className={`flex items-center gap-2 px-4 py-2 whitespace-nowrap mr-2 transition-all ${
                  activeServiceTab === id
                    ? 'text-primary bg-blue-50 border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                data-testid={`service-tab-${id}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Service Tab Content */}
        <div className="px-4 pt-4">
          {activeServiceTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-800">Building Services</h2>
              
              {/* Admin Panel (Conditional) */}
              {(user?.role === 'admin' || user?.role === 'super_admin') && (
                <Card className="shadow-md border border-gray-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                          <Settings className="w-4 h-4 text-secondary" />
                        </div>
                        <span>Admin Panel</span>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={() => window.location.href = '/admin'}
                        className="w-full bg-secondary text-white hover:bg-green-700 py-3 rounded-lg font-medium"
                        data-testid="button-admin-panel"
                      >
                        Access Admin Panel
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/financial'}
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                        data-testid="button-financial-management"
                      >
                        <DollarSign className="w-4 h-4" />
                        Financial Management
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* My Fees Panel (For all users) */}
              <Card className="shadow-md border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <span>Society Fees</span>
                    </h3>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/my-fees'}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-lg font-medium"
                    data-testid="button-my-fees"
                  >
                    View My Fees
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Service Access */}
              <Card className="shadow-md border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-800 mb-4">Quick Access</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveServiceTab('biometric')}
                      className="flex flex-col items-center p-4 h-auto"
                      data-testid="button-quick-biometric"
                    >
                      <Fingerprint className="w-6 h-6 mb-2 text-blue-600" />
                      <span className="text-sm">Biometric Access</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveServiceTab('documents')}
                      className="flex flex-col items-center p-4 h-auto"
                      data-testid="button-quick-documents"
                    >
                      <FileText className="w-6 h-6 mb-2 text-green-600" />
                      <span className="text-sm">Documents</span>
                    </Button>
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveServiceTab('reports')}
                        className="flex flex-col items-center p-4 h-auto"
                        data-testid="button-quick-reports"
                      >
                        <BarChart3 className="w-6 h-6 mb-2 text-purple-600" />
                        <span className="text-sm">Reports</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card className="shadow-md border border-gray-200 bg-white">
                <CardContent className="p-4">
                  <h3 className="font-medium text-gray-800 mb-4">Emergency Contacts</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="text-primary text-sm font-semibold">S</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800">Security Desk</span>
                          <p className="text-xs text-gray-500">24/7 Available</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-primary text-white hover:bg-blue-700 px-4 py-2 rounded-md"
                        onClick={() => window.location.href = 'tel:+1234567890'}
                        data-testid="button-call-security"
                      >
                        Call
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="text-secondary text-sm font-semibold">M</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-800">Maintenance</span>
                          <p className="text-xs text-gray-500">9 AM - 6 PM</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-secondary text-white hover:bg-green-700 px-4 py-2 rounded-md"
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
          )}

          {activeServiceTab === 'messages' && <MessagingTab />}
          {activeServiceTab === 'biometric' && <BiometricAccessTab />}
          {activeServiceTab === 'documents' && <TenantDocumentsTab />}
          {activeServiceTab === 'reports' && (user?.role === 'admin' || user?.role === 'super_admin') && <BookingReportsTab />}
        </div>
      </div>
    );
  };

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
      <header className="bg-primary text-white px-4 py-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-tight">Ultima Skymax</h1>
              <p className="text-blue-100 text-xs opacity-90" data-testid="text-user-info">
                {user.unitNumber ? `Unit ${user.unitNumber}` : user.role} • {user.firstName} {user.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2 rounded-full hover:bg-white hover:bg-opacity-20 text-white transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">3</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { credentials: 'include' });
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Logout error:', error);
                  window.location.href = '/login';
                }
              }}
              className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 text-white transition-colors"
              data-testid="button-logout"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="pt-4">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'community' && renderCommunityTab()}
          {activeTab === 'bookings' && renderBookingsTab()}
          {activeTab === 'visitors' && <VisitorsTab />}
          {activeTab === 'services' && renderServicesTab()}
          {activeTab === 'watchman' && user?.role === 'watchman' && <WatchmanDashboard />}
          {activeTab === 'admin' && (user?.role === 'admin' || user?.role === 'super_admin') && <MobileAdminDashboard />}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user?.role} />

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

      <BookingManagementModal
        open={showBookingManagementModal}
        onOpenChange={setShowBookingManagementModal}
        bookings={(Array.isArray(bookings) ? bookings : []) as any}
      />

      {/* Comments Modal */}
      {commentPostId && (
        <Comments
          postId={commentPostId}
          isOpen={true}
          onClose={() => setCommentPostId(null)}
        />
      )}


    </div>
  );
}
