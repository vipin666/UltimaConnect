import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, Settings, MessageSquare, Wrench, UserCheck, UserX, Shield, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { User, MaintenanceRequestWithUsers } from "@shared/schema";

export function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance'>('users');

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: maintenanceRequests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequestWithUsers[]>({
    queryKey: ['/api/maintenance-requests'],
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

  const renderUsersTab = () => (
    <div className="space-y-4">
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
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="shadow-md border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {user.firstName} {user.lastName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {user.unitNumber ? `Unit ${user.unitNumber}` : user.role} • {user.email}
                      </p>
                    </div>
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
              </CardContent>
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
    </div>
  );
}