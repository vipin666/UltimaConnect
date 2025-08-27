import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, MessageSquare, Wrench, UserCheck, UserX, Shield, AlertTriangle, Search, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { User, MaintenanceRequestWithUsers } from "@shared/schema";
import { BookingManagementModal } from "../bookings/BookingManagementModal";

export function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance'>('users');
  const [viewAllDropdown, setViewAllDropdown] = useState(true);
  const [showBookingManagementModal, setShowBookingManagementModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [flatFilter, setFlatFilter] = useState('all');
  const [expandedFlats, setExpandedFlats] = useState<Set<string>>(new Set(['bookings']));

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: maintenanceRequests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequestWithUsers[]>({
    queryKey: ['/api/maintenance-requests'],
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery<any[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
      return response.json();
    },
  });

  const { data: allPosts = [], isLoading: postsLoading } = useQuery<any[]>({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts');
      return response.json();
    },
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<any[]>({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      return response.json();
    },
  });

  const { data: biometricRequests = [], isLoading: biometricLoading } = useQuery<any[]>({
    queryKey: ['/api/biometric-requests'],
    queryFn: async () => {
      const response = await fetch('/api/biometric-requests');
      return response.json();
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      return apiRequest('PATCH', `/api/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User updated",
        description: "User status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const updateMaintenanceStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, assignedTo }: { requestId: string; status: string; assignedTo?: string }) => {
      return apiRequest('PATCH', `/api/maintenance-requests/${requestId}/status`, { status, assignedTo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests'] });
      toast({
        title: "Request updated",
        description: "Maintenance request has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance request",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Filter and group users
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(searchLower) ||
                         (user.unitNumber?.toLowerCase() || '').includes(searchLower) ||
                         (user.email?.toLowerCase() || '').includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesFlat = flatFilter === 'all' || user.unitNumber === flatFilter;
    
    return matchesSearch && matchesStatus && matchesRole && matchesFlat;
  });

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

  // Group users by flat number
  const groupedUsers = sortedUsersWithActivity.reduce((groups, user) => {
    const flatNumber = user.unitNumber || 'Unknown';
    if (!groups[flatNumber]) {
      groups[flatNumber] = [];
    }
    groups[flatNumber].push(user);
    return groups;
  }, {} as Record<string, typeof sortedUsersWithActivity>);

  // Calculate total activity for each flat
  const flatsWithActivity = Object.keys(groupedUsers).map(flatNumber => {
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

  const renderUsersTab = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-xs text-green-700">Active Users</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">
              {users.filter(u => u.status === 'pending').length}
            </div>
            <div className="text-xs text-yellow-700">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-red-600">
              {users.filter(u => u.status === 'suspended').length}
            </div>
            <div className="text-xs text-red-700">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-md border border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, flat, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
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

            <Select value={flatFilter} onValueChange={setFlatFilter}>
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
                setSearchTerm('');
                setStatusFilter('all');
                setRoleFilter('all');
                setFlatFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {usersLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedFlatsWithActivity.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No residents found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFlatsWithActivity.map((flat) => (
            <Card key={flat.flatNumber} className="shadow-md border border-gray-200 overflow-hidden">
              {/* Flat Header */}
              <div
                className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border-b"
                onClick={() => toggleFlatExpansion(flat.flatNumber)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {expandedFlats.has(flat.flatNumber) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Flat {flat.flatNumber}
                      </h4>
                      <p className="text-sm text-gray-500">
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
                <div className="bg-white">
                  {flat.users.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-800">
                              {user.firstName} {user.lastName}
                            </h5>
                            <p className="text-sm text-gray-500">
                              {user.email} • {user.role}
                            </p>
                          </div>
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
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(user.status)}>
                              {user.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {user.status === 'pending' && (
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: 'active' })}
                            disabled={updateUserStatusMutation.isPending}
                            className="bg-green-600 text-white hover:bg-green-700"
                            data-testid={`button-approve-${user.id}`}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: 'suspended' })}
                            disabled={updateUserStatusMutation.isPending}
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            data-testid={`button-suspend-${user.id}`}
                          >
                            <UserX className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-orange-600">
              {maintenanceRequests.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-xs text-orange-700">Pending Requests</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 text-center">
            <div className="text-xl font-bold text-blue-600">
              {maintenanceRequests.filter(r => r.status === 'in_progress').length}
            </div>
            <div className="text-xs text-blue-700">In Progress</div>
          </CardContent>
        </Card>
      </div>

      {requestsLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {maintenanceRequests.map((request) => (
            <Card key={request.id} className="shadow-md border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{request.title}</h4>
                      <p className="text-sm text-gray-500">
                        Unit {request.unitNumber} • {request.user.firstName} {request.user.lastName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <Badge className={getPriorityColor(request.priority)}>
                      {request.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {request.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                
                <div className="text-xs text-gray-500 mb-3">
                  Category: {request.category} • Created: {format(new Date(request.createdAt!), 'MMM d, yyyy')}
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => updateMaintenanceStatusMutation.mutate({ 
                        requestId: request.id, 
                        status: 'in_progress' 
                      })}
                      disabled={updateMaintenanceStatusMutation.isPending}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      data-testid={`button-start-${request.id}`}
                    >
                      Start Work
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateMaintenanceStatusMutation.mutate({ 
                        requestId: request.id, 
                        status: 'completed' 
                      })}
                      disabled={updateMaintenanceStatusMutation.isPending}
                      className="bg-green-600 text-white hover:bg-green-700"
                      data-testid={`button-complete-${request.id}`}
                    >
                      Mark Complete
                    </Button>
                  </div>
                )}

                {request.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => updateMaintenanceStatusMutation.mutate({ 
                      requestId: request.id, 
                      status: 'completed' 
                    })}
                    disabled={updateMaintenanceStatusMutation.isPending}
                    className="bg-green-600 text-white hover:bg-green-700"
                    data-testid={`button-complete-${request.id}`}
                  >
                    Mark Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderViewAllTab = () => {
    // Combine all requests and activities
    const allActivities = [
      ...maintenanceRequests.map(req => ({
        ...req,
        type: 'maintenance',
        title: req.title,
        description: req.description,
        status: req.status,
        priority: req.priority,
        user: req.user,
        createdAt: req.createdAt,
        category: req.category
      })),
      ...complaints.map(comp => ({
        ...comp,
        type: 'complaint',
        title: comp.title,
        description: comp.content,
        status: comp.status || 'active',
        priority: 'medium',
        user: comp.author,
        createdAt: comp.createdAt,
        category: 'Community'
      })),
      ...bookings.map(book => ({
        ...book,
        type: 'booking',
        title: `${book.amenityName || 'Unknown Amenity'} Booking`,
        description: `Booked for ${book.bookingDate} from ${book.startTime} to ${book.endTime}`,
        status: book.status,
        priority: 'low',
        user: { firstName: book.firstName, lastName: book.lastName, unitNumber: book.unitNumber },
        createdAt: book.createdAt,
        category: 'Amenity Booking'
      })),
      ...biometricRequests.map(bio => ({
        ...bio,
        type: 'biometric',
        title: `Biometric Access Request - ${bio.requestType}`,
        description: bio.reason,
        status: bio.status,
        priority: bio.accessLevel === 'high' ? 'high' : 'medium',
        user: { firstName: bio.firstName, lastName: bio.lastName, unitNumber: bio.unitNumber },
        createdAt: bio.createdAt,
        category: 'Access Control'
      }))
    ];

    // Sort by creation date (newest first)
    const sortedActivities = allActivities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'maintenance': return <Wrench className="w-5 h-5 text-blue-600" />;
        case 'complaint': return <MessageSquare className="w-5 h-5 text-orange-600" />;
        case 'booking': return <Calendar className="w-5 h-5 text-green-600" />;
        case 'biometric': return <Shield className="w-5 h-5 text-purple-600" />;
        default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'maintenance': return 'bg-blue-100 border-blue-200';
        case 'complaint': return 'bg-orange-100 border-orange-200';
        case 'booking': return 'bg-green-100 border-green-200';
        case 'biometric': return 'bg-purple-100 border-purple-200';
        default: return 'bg-gray-100 border-gray-200';
      }
    };

    return (
      <div className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">
                {maintenanceRequests.length}
              </div>
              <div className="text-xs text-blue-700">Maintenance</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-orange-600">
                {complaints.length}
              </div>
              <div className="text-xs text-orange-700">Complaints</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">
                {bookings.length}
              </div>
              <div className="text-xs text-green-700">Bookings</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-purple-600">
                {biometricRequests.length}
              </div>
              <div className="text-xs text-purple-700">Biometric</div>
            </CardContent>
          </Card>
        </div>

        {/* All Activities List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800">All Activities & Requests</h3>
          
          {sortedActivities.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No activities found</p>
              </CardContent>
            </Card>
          ) : (
            sortedActivities.map((activity, index) => (
              <Card key={`${activity.type}-${index}`} className={getTypeColor(activity.type)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        {getTypeIcon(activity.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-gray-500">
                          {activity.user?.firstName} {activity.user?.lastName}
                          {activity.user?.unitNumber && ` (${activity.user.unitNumber})`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getPriorityColor(activity.priority)}>
                        {activity.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {activity.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Category: {activity.category} • Created: {format(new Date(activity.createdAt), 'MMM d, yyyy HH:mm')}
                  </div>

                  {/* Action buttons based on type and status */}
                  {activity.type === 'maintenance' && activity.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateMaintenanceStatusMutation.mutate({ 
                          requestId: activity.id, 
                          status: 'in_progress' 
                        })}
                        disabled={updateMaintenanceStatusMutation.isPending}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Start Work
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateMaintenanceStatusMutation.mutate({ 
                          requestId: activity.id, 
                          status: 'completed' 
                        })}
                        disabled={updateMaintenanceStatusMutation.isPending}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  )}

                  {activity.type === 'maintenance' && activity.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => updateMaintenanceStatusMutation.mutate({ 
                        requestId: activity.id, 
                        status: 'completed' 
                      })}
                      disabled={updateMaintenanceStatusMutation.isPending}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      Mark Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-4 text-white">
        <h2 className="text-lg font-semibold mb-1">Admin Dashboard</h2>
        <p className="text-purple-100 text-sm">Manage users and building operations</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className="flex-1 text-sm"
          data-testid="tab-users"
        >
          <Users className="w-4 h-4 mr-2" />
          Users
        </Button>
        <Button
          variant={activeTab === 'maintenance' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('maintenance')}
          className="flex-1 text-sm"
          data-testid="tab-maintenance"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Maintenance
        </Button>

      </div>

      {/* Tab Content */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'maintenance' && renderMaintenanceTab()}

      {/* Recent Posts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Recent Community Posts</h3>
          <Badge variant="outline" className="text-sm">
            {allPosts.length} Total Posts
          </Badge>
        </div>
        
        {/* Posts Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-blue-600">
                {allPosts.filter(p => p.type === 'announcement').length}
              </div>
              <div className="text-xs text-blue-700">Announcements</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-orange-600">
                {allPosts.filter(p => p.type === 'complaint').length}
              </div>
              <div className="text-xs text-orange-700">Complaints</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">
                {allPosts.filter(p => p.type === 'general').length}
              </div>
              <div className="text-xs text-green-700">General</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts List */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Latest Posts</h4>
          {allPosts.slice(0, 5).map((post) => (
            <Card key={post.id} className="bg-white border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      post.type === 'announcement' ? 'bg-blue-100' :
                      post.type === 'complaint' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      <MessageSquare className={`w-4 h-4 ${
                        post.type === 'announcement' ? 'text-blue-600' :
                        post.type === 'complaint' ? 'text-orange-600' :
                        'text-green-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-800">
                        {post.title}
                      </h5>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>
                          {post.author?.firstName} {post.author?.lastName}
                          {post.author?.unitNumber && ` (${post.author.unitNumber})`}
                        </span>
                        <span>•</span>
                        <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {post.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{post.likes?.length || 0} likes</span>
                      <span>•</span>
                      <span>{post.comments?.length || 0} comments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bookings Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Amenity Bookings</h3>
          <Button
            onClick={() => setShowBookingManagementModal(true)}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Manage All Bookings
          </Button>
        </div>
        
        {/* Quick Booking Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-xs text-green-700">Active Bookings</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </div>
              <div className="text-xs text-yellow-700">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3 text-center">
              <div className="text-xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'cancelled').length}
              </div>
              <div className="text-xs text-red-700">Cancelled</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Recent Bookings</h4>
          {bookings.slice(0, 5).map((booking) => (
            <Card key={booking.id} className="bg-white border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">
                        {booking.amenityName || 'Unknown Amenity'}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {booking.firstName} {booking.lastName} {booking.unitNumber && `(${booking.unitNumber})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                     booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}>
                      {booking.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(booking.bookingDate), 'MMM d, yyyy')} • {booking.startTime}
                    </p>
                    {booking.status === 'pending' && (
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
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* View All Dropdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">All Activities Overview</h3>
          <Button
            variant="outline"
            onClick={() => setViewAllDropdown(!viewAllDropdown)}
            className="flex items-center space-x-2"
          >
            {viewAllDropdown ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>{viewAllDropdown ? 'Hide' : 'Show'} All Activities</span>
          </Button>
        </div>
        
        {viewAllDropdown && renderViewAllTab()}
      </div>

      {/* Booking Management Modal */}
      <BookingManagementModal
        open={showBookingManagementModal}
        onOpenChange={setShowBookingManagementModal}
        bookings={bookings}
      />
    </div>
  );
}