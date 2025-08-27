import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  BarChart, 
  Settings, 
  Wrench, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Home, 
  Fingerprint,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserManagement } from "./UserManagement";
import MaintenanceManagement from "./MaintenanceManagement";
import { FlatManagement } from "./FlatManagement";
import { BiometricManagement } from "./BiometricManagement";
import { CommitteeManagement } from "./CommitteeManagement";
import { FlatDocumentsPanel } from "./FlatDocumentsPanel";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function MobileAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Check for target tab from sessionStorage (for navigation from priority actions)
  useEffect(() => {
    const targetTab = sessionStorage.getItem('adminTargetTab');
    if (targetTab) {
      setActiveTab(targetTab);
      sessionStorage.removeItem('adminTargetTab');
    }
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [residentTypeFilter, setResidentTypeFilter] = useState<'all' | 'owners' | 'tenants'>('all');
  const [flatFilter, setFlatFilter] = useState('all');
  const [expandedFlats, setExpandedFlats] = useState<Set<string>>(new Set());
  const [complaintComments, setComplaintComments] = useState<Record<string, string>>({});
  const [showCommentInput, setShowCommentInput] = useState<Record<string, boolean>>({});
  const [documentsPanelOpen, setDocumentsPanelOpen] = useState(false);
  const [selectedFlatForDocuments, setSelectedFlatForDocuments] = useState<string>('');

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const { data: complaints = [] } = useQuery<any[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: maintenanceRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/maintenance-requests'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance-requests');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: bookings = [] } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: biometricRequests = [] } = useQuery<any[]>({
    queryKey: ['/api/biometric-requests'],
    queryFn: async () => {
      const response = await fetch('/api/biometric-requests');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: visitors = [], isLoading: visitorsLoading } = useQuery<any[]>({
    queryKey: ['/api/visitors'],
    queryFn: async () => {
      const response = await fetch('/api/visitors');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
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

  // Complaint resolution mutation
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
      toast({
        title: "Error",
        description: "Failed to reject complaint",
        variant: "destructive",
      });
    },
  });

  // Biometric approval mutations
  const approveBiometricMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("PUT", `/api/biometric-requests/${requestId}`, { status: 'approved' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/biometric-requests'] });
      toast({
        title: "Biometric request approved",
        description: "The biometric access has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to approve biometric request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectBiometricMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiRequest("PUT", `/api/biometric-requests/${requestId}`, { status: 'rejected' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/biometric-requests'] });
      toast({
        title: "Biometric request rejected",
        description: "The biometric access has been rejected successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to reject biometric request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter users for overview
  const filteredUsers = users.filter((user: any) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(searchLower) ||
                         (user.unitNumber?.toLowerCase() || '').includes(searchLower) ||
                         (user.email?.toLowerCase() || '').includes(searchLower) ||
                         (user.username?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesFlat = flatFilter === 'all' || user.unitNumber === flatFilter;
    const matchesResidentType =
      residentTypeFilter === 'all' ||
      (residentTypeFilter === 'owners' && user.isOwner) ||
      (residentTypeFilter === 'tenants' && !user.isOwner);
    
    return matchesSearch && matchesStatus && matchesRole && matchesFlat && matchesResidentType;
  });

  // Calculate activity for each user
  const usersWithActivity = filteredUsers.map((user: any) => {
    const userComplaints = Array.isArray(complaints) ? complaints.filter((c: any) => c.author?.id === user.id) : [];
    const userMaintenance = Array.isArray(maintenanceRequests) ? maintenanceRequests.filter((m: any) => m.userId === user.id) : [];
    const userBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.userId === user.id) : [];
    
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
  const groupedUsers = sortedUsersWithActivity.reduce((groups: Record<string, typeof sortedUsersWithActivity>, user: any) => {
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
    const totalActivity = flatUsers.reduce((sum: number, user: any) => sum + user.activity.total, 0);
    const totalComplaints = flatUsers.reduce((sum: number, user: any) => sum + user.activity.complaints, 0);
    const totalMaintenance = flatUsers.reduce((sum: number, user: any) => sum + user.activity.maintenance, 0);
    const totalBookings = flatUsers.reduce((sum: number, user: any) => sum + user.activity.bookings, 0);
    
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'resident':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="px-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Admin Dashboard</h2>
              <p className="text-blue-100">Ultima Skymax Connect</p>
            </div>
          </div>
          <p className="text-blue-100 text-sm">
            Welcome, {user?.firstName} {user?.lastName}!
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Complaints</p>
                  <p className="text-xl font-bold">{complaints.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Wrench className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-xl font-bold">{maintenanceRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-purple-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookings</p>
                  <p className="text-xl font-bold">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="visitors" className="text-xs">Visitors</TabsTrigger>
            <TabsTrigger value="management" className="text-xs">Management</TabsTrigger>
            <TabsTrigger value="committee" className="text-xs">Committee</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <Input
                placeholder="Search by name, email, or flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <div className="grid grid-cols-3 gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="resident">Resident</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={residentTypeFilter} onValueChange={(v: any) => setResidentTypeFilter(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Resident Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="owners">Owners</SelectItem>
                    <SelectItem value="tenants">Tenants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Residents by Flat */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Residents by Flat</h3>
              {sortedFlatsWithActivity.map((flat) => (
                <Card key={flat.flatNumber} className="shadow-sm">
                  <CardContent className="p-4">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleFlatExpansion(flat.flatNumber)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Home className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Flat {flat.flatNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {flat.users.length} residents • {flat.activity.total} activities
                          </p>
                          {/* Rented out indicator */}
                          {flat.users.some((u: any) => !u.isOwner) && (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-800">Rented Out</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFlatForDocuments(flat.flatNumber);
                                  setDocumentsPanelOpen(true);
                                }}
                              >
                                Show Documents
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={flat.activity.total > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                          {flat.activity.total} activities
                        </Badge>
                        {expandedFlats.has(flat.flatNumber) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    
                    {expandedFlats.has(flat.flatNumber) && (
                      <div className="mt-4 space-y-2">
                        {flat.users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status}
                                </Badge>
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role.replace('_', ' ')}
                                </Badge>
                                {user.isOwner ? (
                                  <Badge variant="outline" className="text-xs">
                                    Owner
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Tenant
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">
                                {user.activity.total} activities
                              </p>
                              <div className="flex space-x-1 mt-1">
                                {user.activity.complaints > 0 && (
                                  <Badge className="bg-red-100 text-red-800 text-xs">
                                    {user.activity.complaints} complaints
                                  </Badge>
                                )}
                                {user.activity.maintenance > 0 && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                                    {user.activity.maintenance} maintenance
                                  </Badge>
                                )}
                                {user.activity.bookings > 0 && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    {user.activity.bookings} bookings
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {/* Pending Bookings */}
            {bookings && bookings.filter((booking: any) => booking.status === 'pending').length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span>Pending Bookings</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {bookings.filter((booking: any) => booking.status === 'pending').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bookings.filter((booking: any) => booking.status === 'pending').map((booking: any) => (
                    <div key={booking.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-800">
                            {booking.amenityName || 'Unknown Amenity'} Booking
                          </h5>
                          <Badge className="bg-orange-100 text-orange-800">
                            Pending Approval
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.bookingDate).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.firstName} {booking.lastName} {booking.unitNumber && `(${booking.unitNumber})`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => approveBookingMutation.mutate(booking.id)}
                            disabled={approveBookingMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-8"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectBookingMutation.mutate({ bookingId: booking.id })}
                            disabled={rejectBookingMutation.isPending}
                            className="text-xs px-3 py-1 h-8"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending Complaints */}
            {complaints && complaints.filter((complaint: any) => complaint.status === 'active').length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>Active Complaints</span>
                    <Badge className="bg-red-100 text-red-800">
                      {complaints.filter((complaint: any) => complaint.status === 'active').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {complaints.filter((complaint: any) => complaint.status === 'active').map((complaint: any) => (
                    <div key={complaint.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-800">{complaint.title}</h5>
                          <Badge className="bg-red-100 text-red-800">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{complaint.content}</p>
                        <p className="text-xs text-gray-500">
                          By {complaint.author?.firstName} {complaint.author?.lastName} {complaint.author?.unitNumber && `(${complaint.author.unitNumber})`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newShowComment = { ...showCommentInput };
                              newShowComment[complaint.id] = !newShowComment[complaint.id];
                              setShowCommentInput(newShowComment);
                            }}
                            className="text-blue-600 border-blue-300 hover:bg-blue-100 text-xs px-3 py-1 h-8"
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
                            className="text-green-600 border-green-300 hover:bg-green-100 text-xs px-3 py-1 h-8"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
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
                            className="text-xs px-3 py-1 h-8"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
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
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending Biometric Requests */}
            {biometricRequests && biometricRequests.filter((req: any) => req.status === 'pending').length > 0 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Fingerprint className="w-5 h-5 text-blue-600" />
                    <span>Pending Biometric Requests</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {biometricRequests.filter((req: any) => req.status === 'pending').length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {biometricRequests.filter((req: any) => req.status === 'pending').map((req: any) => (
                    <div key={req.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-800">
                            {req.requestType} Access Request
                          </h5>
                          <Badge className="bg-blue-100 text-blue-800">
                            Pending Approval
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{req.reason}</p>
                        <p className="text-xs text-gray-500">
                          By {req.user?.firstName} {req.user?.lastName} {req.user?.unitNumber && `(${req.user.unitNumber})`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Access Level: {req.accessLevel}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => approveBiometricMutation.mutate(req.id)}
                            disabled={approveBiometricMutation.isPending}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 h-8"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectBiometricMutation.mutate(req.id)}
                            disabled={rejectBiometricMutation.isPending}
                            className="text-xs px-3 py-1 h-8"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No Pending Requests */}
            {(!bookings || bookings.filter((booking: any) => booking.status === 'pending').length === 0) && 
             (!complaints || complaints.filter((complaint: any) => complaint.status === 'active').length === 0) && 
             (!biometricRequests || biometricRequests.filter((req: any) => req.status === 'pending').length === 0) && (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">No Pending Requests</p>
                  <p className="text-green-600 text-sm">All requests have been processed</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="visitors" className="space-y-4">
            {/* Visitor Management */}
            <Card className="shadow-sm">
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
                                 ) : (Array.isArray(visitors) ? visitors.length === 0 : true) ? (
                   <p className="text-center text-gray-500 py-4">No visitors found</p>
                 ) : (
                   <div className="space-y-3">
                     {(Array.isArray(visitors) ? visitors.slice(0, 5) : []).map((visitor: any) => (
                      <div key={visitor.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{visitor.name}</h4>
                            <p className="text-xs text-gray-600">Unit {visitor.unitToVisit} • {visitor.purpose}</p>
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
                                Arrival: {new Date(visitor.arrivalTime).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {Array.isArray(visitors) && visitors.length > 5 && (
                      <Button variant="outline" className="w-full text-xs">
                        View All Visitors ({visitors.length})
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => setActiveTab('users')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Full Admin Panel
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/financial'}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    Financial Management
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/visitors'}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Visitor Management
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="committee" className="space-y-4">
            <CommitteeManagement />
          </TabsContent>
        </Tabs>
      </div>

      {/* Flat Documents Panel */}
      <FlatDocumentsPanel
        flatNumber={selectedFlatForDocuments}
        open={documentsPanelOpen}
        onOpenChange={setDocumentsPanelOpen}
      />
    </div>
  );
}
