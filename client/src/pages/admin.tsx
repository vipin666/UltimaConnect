import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, AlertTriangle, Calendar, BarChart, Settings, Wrench, Search, ChevronDown, ChevronRight, Home, Fingerprint, ArrowLeft, MessageSquare, UserCheck, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, PostWithAuthor } from "@shared/schema";
import { UserManagement } from "@/components/admin/UserManagement";
import MaintenanceManagement from "@/components/admin/MaintenanceManagement";
import { FlatManagement } from "@/components/admin/FlatManagement";
import { BiometricManagement } from "@/components/admin/BiometricManagement";
import { CommitteeManagement } from "@/components/admin/CommitteeManagement";
import ServicesManagement from "@/components/admin/ServicesManagement";
import { useState, useEffect } from "react";

// Helper function to generate original password based on user data
const generateOriginalPassword = (user: any): string => {
  if (user.role === 'super_admin' || user.role === 'admin') {
    return 'admin123';
  }
  if (user.role === 'resident' && user.unitNumber) {
    return `resident${user.unitNumber}`;
  }
  if (user.role === 'watchman') {
    return 'watchman123';
  }
  if (user.role === 'caretaker') {
    return 'caretaker123';
  }
  if (user.role === 'secretary') {
    return 'secretary123';
  }
  if (user.role === 'president') {
    return 'president123';
  }
  if (user.role === 'treasurer') {
    return 'treasurer123';
  }
  return 'password123'; // fallback
};

// Helper function to get display password (actual reset password or generated)
const getDisplayPassword = (user: any, resetPasswords: Record<string, string>): string => {
  // If user has a reset password stored in the UI state, show that
  if (resetPasswords[user.id]) {
    return resetPasswords[user.id];
  }
  // Otherwise show the generated original password
  return generateOriginalPassword(user);
};

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Filter states for overview
  const [overviewSearchTerm, setOverviewSearchTerm] = useState('');
  const [overviewStatusFilter, setOverviewStatusFilter] = useState('all');
  const [overviewRoleFilter, setOverviewRoleFilter] = useState('all');
  const [overviewFlatFilter, setOverviewFlatFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFlats, setExpandedFlats] = useState<Set<string>>(new Set());
  const [complaintComments, setComplaintComments] = useState<Record<string, string>>({});
  const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({});
  const [passwordResetUser, setPasswordResetUser] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});

  // Check for target tab from sessionStorage (for navigation from priority actions)
  useEffect(() => {
    const targetTab = sessionStorage.getItem('adminTargetTab');
    if (targetTab) {
      setActiveTab(targetTab);
      sessionStorage.removeItem('adminTargetTab');
    }
  }, []);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: maintenanceRequests, isLoading: maintenanceLoading } = useQuery<any[]>({
    queryKey: ['/api/maintenance-requests'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance-requests');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: allPosts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: biometricRequests, isLoading: biometricLoading } = useQuery<any[]>({
    queryKey: ['/api/biometric-requests'],
    queryFn: async () => {
      const response = await fetch('/api/biometric-requests');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: visitors, isLoading: visitorsLoading } = useQuery<any[]>({
    queryKey: ['/api/visitors'],
    queryFn: async () => {
      const response = await fetch('/api/visitors');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Filter users for overview
  const filteredUsers = users?.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const searchLower = overviewSearchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(searchLower) ||
                         (user.unitNumber?.toLowerCase() || '').includes(searchLower) ||
                         (user.email?.toLowerCase() || '').includes(searchLower) ||
                         (user.username?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = overviewStatusFilter === 'all' || user.status === overviewStatusFilter;
    const matchesRole = overviewRoleFilter === 'all' || user.role === overviewRoleFilter;
    const matchesFlat = overviewFlatFilter === 'all' || user.unitNumber === overviewFlatFilter;
    
    return matchesSearch && matchesStatus && matchesRole && matchesFlat;
  }) || [];

  // Calculate activity for each user
  const usersWithActivity = filteredUsers.map(user => {
    const userComplaints = Array.isArray(complaints) ? complaints.filter(c => c.author?.id === user.id) : [];
    const userMaintenance = Array.isArray(maintenanceRequests) ? maintenanceRequests.filter(m => m.userId === user.id) : [];
    const userBookings = Array.isArray(bookings) ? bookings.filter(b => b.userId === user.id) : [];
    
    const totalActivity = userComplaints.length + userMaintenance.length + userBookings.length;
    
    return {
      ...user,
      activity: {
        complaints: userComplaints.length,
        maintenance: userMaintenance.length,
        bookings: userBookings.length,
        total: totalActivity
      }
    };
  });

  // Sort users by activity (highest first)
  const sortedUsersWithActivity = usersWithActivity.sort((a, b) => b.activity.total - a.activity.total);

  // Group users by flat number for overview
  const groupedUsers = sortedUsersWithActivity.reduce((groups, user) => {
    const flatNumber = user.unitNumber || 'Unknown';
    if (!groups[flatNumber]) {
      groups[flatNumber] = [];
    }
    groups[flatNumber].push(user);
    return groups;
  }, {} as Record<string, typeof sortedUsersWithActivity>);

  // Sort flat numbers
  const sortedFlatNumbers = Object.keys(groupedUsers).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, ''));
    const bNum = parseInt(b.replace(/\D/g, ''));
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });

  // Calculate total activity for each flat
  const flatsWithActivity = sortedFlatNumbers.map(flatNumber => {
    const flatUsers = groupedUsers[flatNumber];
    const totalActivity = flatUsers.reduce((sum, user) => sum + user.activity.total, 0);
    const totalComplaints = flatUsers.reduce((sum, user) => sum + user.activity.complaints, 0);
    const totalMaintenance = flatUsers.reduce((sum, user) => sum + user.activity.maintenance, 0);
    const totalBookings = flatUsers.reduce((sum, user) => sum + user.activity.bookings, 0);
    
    return {
      flatNumber,
      users: flatUsers,
      activity: {
        total: totalActivity,
        complaints: totalComplaints,
        maintenance: totalMaintenance,
        bookings: totalBookings
      }
    };
  });

  // Sort flats by total activity (highest first)
  const sortedFlatsWithActivity = flatsWithActivity.sort((a, b) => b.activity.total - a.activity.total);

  const toggleFlatExpansion = (flatNumber: string) => {
    const newExpanded = new Set(expandedFlats);
    if (newExpanded.has(flatNumber)) {
      newExpanded.delete(flatNumber);
    } else {
      newExpanded.add(flatNumber);
    }
    setExpandedFlats(newExpanded);
  };

  const copyCredentials = (username: string, password: string) => {
    const credentials = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials).then(() => {
      toast({
        title: "Credentials copied",
        description: "Username and password copied to clipboard",
      });
    });
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest('PATCH', `/api/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User status updated successfully",
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
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: async ({ postId, status, adminComment }: { postId: string; status: string; adminComment?: string }) => {
      return apiRequest('PATCH', `/api/posts/${postId}/status`, { status, adminComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Complaint status updated successfully",
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
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    },
  });

  const rejectComplaintMutation = useMutation({
    mutationFn: async ({ postId, adminComment }: { postId: string; adminComment?: string }) => {
      return apiRequest('PATCH', `/api/posts/${postId}/status`, { status: 'rejected', adminComment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Complaint rejected successfully",
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
        description: "Failed to reject complaint",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      console.log('Password reset mutation called');
      console.log('User ID:', userId);
      console.log('New password:', newPassword);
      
      const response = await apiRequest('PATCH', `/api/users/${userId}/password`, { newPassword });
      console.log('Password reset response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Password reset success:', data);
      // Store the new password in the UI state
      setResetPasswords(prev => ({
        ...prev,
        [passwordResetUser!]: newPassword
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setPasswordResetUser(null);
      setNewPassword('');
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
    },
    onError: (error) => {
      console.log('Password reset error:', error);
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
        description: "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Booking approval mutations
  const approveBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
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

  const rejectBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking rejected",
        description: "The booking has been rejected successfully.",
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

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-medium mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/"}
              className="text-white border-white hover:bg-white hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <div>
              <h1 className="text-xl font-medium">Admin Panel</h1>
              <p className="text-blue-100 text-sm">Ultima Skymax Connect</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-blue-100">Welcome, {user?.firstName} {user?.lastName}</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { credentials: 'include' });
                  window.location.href = '/login';
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
              className="text-white border-white hover:bg-white hover:text-primary"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="flats" className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span>Flats</span>
            </TabsTrigger>
            <TabsTrigger value="biometric" className="flex items-center space-x-2">
              <Fingerprint className="w-4 h-4" />
              <span>Biometric</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <Wrench className="w-4 h-4" />
              <span>Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Complaints</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Actions</span>
            </TabsTrigger>
            <TabsTrigger value="visitors" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Visitors</span>
            </TabsTrigger>
            <TabsTrigger value="committee" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Committee</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>Services</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-material">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Users</p>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold">{complaints?.length || 0}</p>
                  <p className="text-sm text-gray-600">Complaints</p>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Array.isArray(bookings) ? bookings.length : 0}</p>
                  <p className="text-sm text-gray-600">Active Bookings</p>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4 text-center">
                  <Wrench className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{Array.isArray(maintenanceRequests) ? maintenanceRequests.length : 0}</p>
                  <p className="text-sm text-gray-600">Maintenance Requests</p>
                </CardContent>
              </Card>
            </div>

            {/* Priority Actions - New Requests Requiring Attention */}
            {(Array.isArray(bookings) && bookings.filter(book => book.status === 'pending').length > 0) || 
             (Array.isArray(complaints) && complaints.filter(complaint => complaint.status === 'active').length > 0) || 
             (Array.isArray(biometricRequests) && biometricRequests.filter(req => req.status === 'pending').length > 0) ? (
              <Card className="shadow-material border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 text-orange-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Priority Actions Required</span>
                    <Badge className="bg-orange-200 text-orange-800">
                      {((Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').length : 0) + 
                        (Array.isArray(complaints) ? complaints.filter(complaint => complaint.status === 'active').length : 0) + 
                        (Array.isArray(biometricRequests) ? biometricRequests.filter(req => req.status === 'pending').length : 0))} New Requests
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pending Bookings */}
                  {Array.isArray(bookings) && bookings.filter(book => book.status === 'pending').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-orange-800 flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Pending Booking Approvals ({Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').length : 0})</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').slice(0, 4) : []).map((booking) => (
                          <div key={booking.id} className="p-3 bg-white border border-orange-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800">
                                  {booking.amenityName || 'Unknown Amenity'}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {new Date(booking.bookingDate).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {booking.firstName} {booking.lastName} {booking.unitNumber && `(${booking.unitNumber})`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => approveBookingMutation.mutate(booking.id)}
                                    disabled={approveBookingMutation.isPending}
                                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 h-6"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectBookingMutation.mutate({ bookingId: booking.id })}
                                    disabled={rejectBookingMutation.isPending}
                                    className="text-xs px-2 py-1 h-6"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {Array.isArray(bookings) && bookings.filter(book => book.status === 'pending').length > 4 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveTab('actions')}
                          className="text-orange-600 border-orange-300 hover:bg-orange-100"
                        >
                          View All Pending Bookings ({Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').length : 0})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Active Complaints */}
                  {Array.isArray(complaints) && complaints.filter(complaint => complaint.status === 'active').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-orange-800 flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Active Complaints Requiring Resolution ({Array.isArray(complaints) ? complaints.filter(complaint => complaint.status === 'active').length : 0})</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(complaints) ? complaints.filter(complaint => complaint.status === 'active').slice(0, 4) : []).map((complaint) => (
                          <div key={complaint.id} className="p-3 bg-white border border-orange-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800">{complaint.title}</h5>
                                <p className="text-sm text-gray-600 line-clamp-2">{complaint.content}</p>
                                <p className="text-xs text-gray-500">
                                  By {complaint.author?.firstName} {complaint.author?.lastName} {complaint.author?.unitNumber && `(${complaint.author.unitNumber})`}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const newShowComment = { ...showCommentInput };
                                      newShowComment[complaint.id] = !newShowComment[complaint.id];
                                      setShowCommentInput(newShowComment);
                                    }}
                                    className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1 h-6"
                                  >
                                    {showCommentInput[complaint.id] ? 'Cancel' : 'Add Comment'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => resolveComplaintMutation.mutate({ 
                                      postId: complaint.id, 
                                      status: 'resolved',
                                      adminComment: complaintComments[complaint.id] || undefined
                                    })}
                                    disabled={resolveComplaintMutation.isPending}
                                    className="text-green-600 border-green-300 hover:bg-green-100 text-xs px-2 py-1 h-6"
                                  >
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectComplaintMutation.mutate({ 
                                      postId: complaint.id,
                                      adminComment: complaintComments[complaint.id] || undefined
                                    })}
                                    disabled={rejectComplaintMutation.isPending}
                                    className="text-xs px-2 py-1 h-6"
                                  >
                                    Reject
                                  </Button>
                                </div>
                                {showCommentInput[complaint.id] && (
                                  <div className="mt-2">
                                    <Input
                                      placeholder="Add admin comment (optional)..."
                                      value={complaintComments[complaint.id] || ''}
                                      onChange={(e) => {
                                        const newComments = { ...complaintComments };
                                        newComments[complaint.id] = e.target.value;
                                        setComplaintComments(newComments);
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {complaints.filter(complaint => complaint.status === 'active').length > 4 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setActiveTab('complaints')}
                          className="text-orange-600 border-orange-300 hover:bg-orange-100"
                        >
                          View All Active Complaints ({complaints.filter(complaint => complaint.status === 'active').length})
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Pending Biometric Requests */}
                  {Array.isArray(biometricRequests) && biometricRequests.filter(req => req.status === 'pending').length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-md font-medium text-orange-800 flex items-center space-x-2">
                        <Fingerprint className="w-4 h-4" />
                        <span>Pending Biometric Access Requests ({biometricRequests.filter(req => req.status === 'pending').length})</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(biometricRequests) ? biometricRequests.filter(req => req.status === 'pending').slice(0, 4) : []).map((request) => (
                          <div key={request.id} className="p-3 bg-white border border-orange-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-800">
                                  Biometric Access - {request.requestType}
                                </h5>
                                <p className="text-sm text-gray-600">{request.reason}</p>
                                <p className="text-xs text-gray-500">
                                  {request.firstName} {request.lastName} {request.unitNumber && `(${request.unitNumber})`}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  {request.accessLevel} Access
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setActiveTab('biometric')}
                        className="text-orange-600 border-orange-300 hover:bg-orange-100"
                      >
                        View All Biometric Requests
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-material border-2 border-green-200 bg-green-50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">All Clear!</p>
                  <p className="text-green-600 text-sm">No pending requests requiring immediate attention</p>
                </CardContent>
              </Card>
            )}

            {/* Visitor Parking Overview */}
            {Array.isArray(visitors) && visitors.filter(v => v.guestParkingSlot || v.vehicleNumber).length > 0 && (
              <Card className="shadow-material border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 text-blue-800">
                    <Users className="w-5 h-5" />
                    <span>Visitor Parking Overview</span>
                    <Badge className="bg-blue-200 text-blue-800">
                      {visitors.filter(v => v.guestParkingSlot || v.vehicleNumber).length} Visitors with Vehicles
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(visitors) ? visitors.filter(v => v.guestParkingSlot || v.vehicleNumber).slice(0, 6) : []).map((visitor) => (
                      <div key={visitor.id} className="p-3 bg-white border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{visitor.name}</h5>
                            <p className="text-sm text-gray-600">Unit {visitor.unitToVisit}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              {visitor.vehicleNumber && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  🚗 {visitor.vehicleNumber}
                                </Badge>
                              )}
                              {visitor.guestParkingSlot && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  🅿️ {visitor.guestParkingSlot}
                                </Badge>
                              )}
                              <Badge className={`text-xs ${
                                visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                                visitor.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {visitor.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {visitor.arrivalTime && (
                              <p className="text-xs text-gray-500 mt-1">
                                Arrival: {new Date(visitor.arrivalTime).toLocaleDateString()} {new Date(visitor.arrivalTime).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {visitors.filter(v => v.guestParkingSlot || v.vehicleNumber).length > 6 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab('visitors')}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      View All Visitors with Parking ({visitors.filter(v => v.guestParkingSlot || v.vehicleNumber).length})
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filters */}
            <Card className="shadow-material">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, flat, email..."
                      value={overviewSearchTerm}
                      onChange={(e) => setOverviewSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={overviewStatusFilter} onValueChange={setOverviewStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={overviewRoleFilter} onValueChange={setOverviewRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="resident">Residents</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="super_admin">Super Admins</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={overviewFlatFilter} onValueChange={setOverviewFlatFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by flat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Flats</SelectItem>
                      {users?.map(user => user.unitNumber)
                        .filter((value, index, self) => self.indexOf(value) === index)
                        .sort((a, b) => {
                          const aNum = parseInt(a?.replace(/\D/g, '') || '0');
                          const bNum = parseInt(b?.replace(/\D/g, '') || '0');
                          if (aNum !== bNum) return aNum - bNum;
                          return (a || '').localeCompare(b || '');
                        })
                        .map(flatNumber => (
                          <SelectItem key={flatNumber} value={flatNumber || ''}>
                            {flatNumber || 'Unknown'}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setOverviewSearchTerm('');
                      setOverviewStatusFilter('all');
                      setOverviewRoleFilter('all');
                      setOverviewFlatFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Resident Activity List */}
            <Card className="shadow-material">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Flat Activity (Sorted by Activity Level)</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allUserIds = sortedFlatsWithActivity.flatMap(flat => 
                        flat.users.map(user => user.id)
                      );
                      const newShowPasswords: Record<string, boolean> = {};
                      allUserIds.forEach(id => {
                        newShowPasswords[id] = !Object.values(showPasswords).some(show => show);
                      });
                      setShowPasswords(newShowPasswords);
                    }}
                  >
                    {Object.values(showPasswords).some(show => show) ? 'Hide All Passwords' : 'Show All Passwords'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading residents...</p>
                  </div>
                ) : sortedFlatsWithActivity.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No flats found</p>
                ) : (
                  <div className="space-y-4">
                    {sortedFlatsWithActivity.map((flat) => (
                      <div key={flat.flatNumber} className="border rounded-lg overflow-hidden">
                        {/* Flat Header */}
                        <div
                          className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => toggleFlatExpansion(flat.flatNumber)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {expandedFlats.has(flat.flatNumber) ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                              <div>
                                <h4 className="font-medium text-gray-800">
                                  Flat {flat.flatNumber}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {flat.users.length} resident{flat.users.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="flex items-center space-x-2">
                                  {flat.activity.complaints > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {flat.activity.complaints} Complaints
                                    </Badge>
                                  )}
                                  {flat.activity.maintenance > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {flat.activity.maintenance} Maintenance
                                    </Badge>
                                  )}
                                  {flat.activity.bookings > 0 && (
                                    <Badge variant="default" className="text-xs">
                                      {flat.activity.bookings} Bookings
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Total Activity: {flat.activity.total}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Residents List */}
                        {expandedFlats.has(flat.flatNumber) && (
                          <div className="border-t bg-white">
                            {flat.users.map((user) => (
                              <div
                                key={user.id}
                                className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to appropriate tab based on activity
                                  if (user.activity.complaints > 0) {
                                    setActiveTab('complaints');
                                  } else if (user.activity.maintenance > 0) {
                                    setActiveTab('maintenance');
                                  } else if (user.activity.bookings > 0) {
                                    setActiveTab('actions');
                                  } else {
                                    setActiveTab('users');
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-800">
                                      {user.firstName} {user.lastName}
                                    </h5>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-medium">Username:</span> {user.username} • {user.role}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        <span className="font-medium">Password:</span> 
                                        {showPasswords[user.id] ? (
                                          <span className="ml-1 font-mono">{getDisplayPassword(user, resetPasswords)}</span>
                                        ) : (
                                          <span className="ml-1">••••••••</span>
                                        )}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          togglePasswordVisibility(user.id);
                                        }}
                                        className="h-4 w-4 p-0 text-xs"
                                      >
                                        {showPasswords[user.id] ? 'Hide' : 'Show'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyCredentials(user.username || '', getDisplayPassword(user, resetPasswords));
                                        }}
                                        className="h-4 w-4 p-0 text-xs"
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {user.email}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                      <div className="flex items-center space-x-2">
                                        {user.activity.complaints > 0 && (
                                          <Badge variant="destructive" className="text-xs">
                                            {user.activity.complaints} Complaints
                                          </Badge>
                                        )}
                                        {user.activity.maintenance > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            {user.activity.maintenance} Maintenance
                                          </Badge>
                                        )}
                                        {user.activity.bookings > 0 && (
                                          <Badge variant="default" className="text-xs">
                                            {user.activity.bookings} Bookings
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Total Activity: {user.activity.total}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant={user.status === 'active' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
                                        {user.status}
                                      </Badge>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPasswordResetUser(user.id);
                                          setNewPassword('');
                                        }}
                                        className="mt-2 text-xs px-2 py-1 h-6"
                                      >
                                        Reset Password
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Posts Section */}
            <Card className="shadow-material">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Recent Community Posts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {postsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading posts...</p>
                  </div>
                ) : allPosts?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No posts found</p>
                ) : (
                  (Array.isArray(allPosts) ? allPosts.slice(0, 5) : []).map((post) => (
                    <div key={post.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{post.title}</h5>
                            <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              By {post.author?.firstName} {post.author?.lastName} {post.author?.unitNumber && `(${post.author.unitNumber})`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={post.type === 'complaint' ? 'bg-red-100 text-red-800' : 
                                           post.type === 'general' ? 'bg-blue-100 text-blue-800' : 
                                           'bg-green-100 text-green-800'}>
                            {post.type}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Pending Requests Section */}
            <Card className="shadow-material">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Pending Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pending Biometric Requests */}
                {biometricRequests && biometricRequests.filter(req => req.status === 'pending').length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-700">Biometric Access Requests</h4>
                    {(Array.isArray(biometricRequests) ? biometricRequests.filter(req => req.status === 'pending').slice(0, 3) : []).map((request) => (
                      <div key={request.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Fingerprint className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800">
                                Biometric Access - {request.requestType}
                              </h5>
                              <p className="text-sm text-gray-600">{request.reason}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {request.firstName} {request.lastName} {request.unitNumber && `(${request.unitNumber})`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {request.accessLevel} Access
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Booking Requests */}
                {bookings && bookings.filter(book => book.status === 'pending').length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-700">Pending Booking Requests</h4>
                    {(Array.isArray(bookings) ? bookings.filter(book => book.status === 'pending').slice(0, 3) : []).map((booking) => (
                      <div key={booking.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-800">
                                {booking.amenityName || 'Unknown Amenity'} Booking
                              </h5>
                              <p className="text-sm text-gray-600">
                                {new Date(booking.bookingDate).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {booking.firstName} {booking.lastName} {booking.unitNumber && `(${booking.unitNumber})`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-orange-100 text-orange-800">
                              Pending Approval
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Button
                                size="sm"
                                onClick={() => approveBookingMutation.mutate(booking.id)}
                                disabled={approveBookingMutation.isPending}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 h-6"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectBookingMutation.mutate({ bookingId: booking.id })}
                                disabled={rejectBookingMutation.isPending}
                                className="text-xs px-2 py-1 h-6"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Pending Requests */}
                {(!biometricRequests || biometricRequests.filter(req => req.status === 'pending').length === 0) && 
                 (!bookings || bookings.filter(book => book.status === 'pending').length === 0) && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-green-700 font-medium">No Pending Requests</p>
                    <p className="text-green-600 text-sm">All requests have been processed</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="flats" className="space-y-6">
            <FlatManagement />
          </TabsContent>

          <TabsContent value="biometric" className="space-y-6">
            <BiometricManagement />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceManagement />
          </TabsContent>

          <TabsContent value="complaints" className="space-y-6">
            {/* Complaint Management */}
            <Card className="shadow-material">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Recent Complaints</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {complaintsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading complaints...</p>
                  </div>
                ) : complaints?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4" data-testid="text-no-complaints">No complaints found</p>
                ) : (
                  (Array.isArray(complaints) ? complaints.slice(0, 10) : []).map((complaint: PostWithAuthor) => (
                    <div key={complaint.id} className="p-3 border rounded-lg space-y-2" data-testid={`complaint-${complaint.id}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{complaint.title}</h4>
                        <Badge variant={complaint.status === 'active' ? 'destructive' : complaint.status === 'resolved' ? 'default' : 'secondary'}>
                          {complaint.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{complaint.content.substring(0, 100)}...</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          By {complaint.author?.firstName ?? 'Unknown'} {complaint.author?.lastName ?? ''}
                          {complaint.author?.unitNumber ? ` (Unit ${complaint.author.unitNumber})` : ''}
                        </span>
                        {complaint.status === 'active' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newShowComment = { ...showCommentInput };
                                newShowComment[complaint.id] = !newShowComment[complaint.id];
                                setShowCommentInput(newShowComment);
                              }}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                              {showCommentInput[complaint.id] ? 'Cancel' : 'Add Comment'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveComplaintMutation.mutate({ 
                                postId: complaint.id, 
                                status: 'resolved',
                                adminComment: complaintComments[complaint.id] || undefined
                              })}
                              disabled={resolveComplaintMutation.isPending}
                              data-testid={`button-resolve-${complaint.id}`}
                              className="text-green-600 border-green-300 hover:bg-green-100"
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectComplaintMutation.mutate({ 
                                postId: complaint.id,
                                adminComment: complaintComments[complaint.id] || undefined
                              })}
                              disabled={rejectComplaintMutation.isPending}
                              data-testid={`button-reject-${complaint.id}`}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {showCommentInput[complaint.id] && (
                          <div className="mt-2">
                            <Input
                              placeholder="Add admin comment (optional)..."
                              value={complaintComments[complaint.id] || ''}
                              onChange={(e) => {
                                const newComments = { ...complaintComments };
                                newComments[complaint.id] = e.target.value;
                                setComplaintComments(newComments);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="shadow-material">
                <CardContent className="p-4">
                  <Button variant="outline" className="w-full flex flex-col space-y-2 h-auto py-4" data-testid="button-manage-bookings">
                    <Calendar className="w-8 h-8 text-accent" />
                    <span className="text-sm font-medium">Manage Bookings</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4">
                  <Button variant="outline" className="w-full flex flex-col space-y-2 h-auto py-4" data-testid="button-view-reports">
                    <BarChart className="w-8 h-8 text-secondary" />
                    <span className="text-sm font-medium">View Reports</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4">
                  <Button variant="outline" className="w-full flex flex-col space-y-2 h-auto py-4">
                    <Settings className="w-8 h-8 text-green-500" />
                    <span className="text-sm font-medium">System Settings</span>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-material">
                <CardContent className="p-4">
                  <Button variant="outline" className="w-full flex flex-col space-y-2 h-auto py-4">
                    <Users className="w-8 h-8 text-purple-500" />
                    <span className="text-sm font-medium">Add User</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="visitors" className="space-y-6">
            {/* Visitor Management */}
            <Card className="shadow-material">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Visitor Management</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {Array.isArray(visitors) ? visitors.length : 0} Visitors
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visitorsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading visitors...</p>
                  </div>
                ) : Array.isArray(visitors) && visitors.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No visitors found</p>
                ) : (
                  <div className="space-y-3">
                    {(Array.isArray(visitors) ? visitors.slice(0, 10) : []).map((visitor: any) => (
                      <div key={visitor.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{visitor.name}</h4>
                            <p className="text-sm text-gray-600">Unit {visitor.unitToVisit} • {visitor.purpose}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {visitor.vehicleNumber && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  🚗 {visitor.vehicleNumber}
                                </Badge>
                              )}
                              {visitor.guestParkingSlot && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  🅿️ {visitor.guestParkingSlot}
                                </Badge>
                              )}
                              <Badge className={`text-xs ${
                                visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                                visitor.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                                visitor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {visitor.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {visitor.arrivalTime && (
                              <p className="text-xs text-gray-500 mt-1">
                                Arrival: {new Date(visitor.arrivalTime).toLocaleDateString()} {new Date(visitor.arrivalTime).toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(visitor.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {Array.isArray(visitors) && visitors.length > 10 && (
                      <Button variant="outline" className="w-full">
                        View All Visitors ({visitors.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="committee" className="space-y-6">
            <CommitteeManagement />
          </TabsContent>
          <TabsContent value="services" className="space-y-6">
            <ServicesManagement />
          </TabsContent>
        </Tabs>

        {/* Password Reset Dialog */}
        {passwordResetUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md">
              <h3 className="text-lg font-medium mb-4">Reset User Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPasswordResetUser(null);
                      setNewPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (newPassword.trim()) {
                        resetPasswordMutation.mutate({
                          userId: passwordResetUser,
                          newPassword: newPassword.trim()
                        });
                      }
                    }}
                    disabled={!newPassword.trim() || resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
