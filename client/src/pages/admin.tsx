import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle, Calendar, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User, PostWithAuthor } from "@shared/schema";

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin' || user?.role === 'super_admin',
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ['/api/posts', { type: 'complaint' }],
    queryFn: async () => {
      const response = await fetch('/api/posts?type=complaint');
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
          window.location.href = "/api/login";
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
    mutationFn: async ({ postId, status }: { postId: string; status: string }) => {
      return apiRequest('PATCH', `/api/posts/${postId}/status`, { status });
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
          window.location.href = "/api/login";
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
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-medium">Admin Panel</h1>
          <p className="text-blue-100 text-sm">Ultima Skymax Connect</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* User Management */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading users...</p>
              </div>
            ) : (
              users?.slice(0, 5).map((user: User) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`user-${user.id}`}>
                  <div>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-600">Unit {user.unitNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.status === 'active' ? 'default' : user.status === 'pending' ? 'secondary' : 'destructive'}>
                      {user.status}
                    </Badge>
                    {user.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => updateUserStatusMutation.mutate({ userId: user.id, status: 'active' })}
                        disabled={updateUserStatusMutation.isPending}
                        data-testid={`button-approve-${user.id}`}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
              complaints?.slice(0, 3).map((complaint: PostWithAuthor) => (
                <div key={complaint.id} className="p-3 border rounded-lg space-y-2" data-testid={`complaint-${complaint.id}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{complaint.title}</h4>
                    <Badge variant={complaint.status === 'active' ? 'destructive' : complaint.status === 'resolved' ? 'default' : 'secondary'}>
                      {complaint.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{complaint.content.substring(0, 100)}...</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {complaint.author.firstName} {complaint.author.lastName} (Unit {complaint.author.unitNumber})</span>
                    {complaint.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveComplaintMutation.mutate({ postId: complaint.id, status: 'resolved' })}
                        disabled={resolveComplaintMutation.isPending}
                        data-testid={`button-resolve-${complaint.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>
    </div>
  );
}
