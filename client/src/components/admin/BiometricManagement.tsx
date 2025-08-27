import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Fingerprint, Shield, UserCheck, UserX, Search, Users } from "lucide-react";
import { format } from "date-fns";

export function BiometricManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: biometricRequests = [] } = useQuery({
    queryKey: ["/api/biometric-requests"],
  });

  const enableBiometricMutation = useMutation({
    mutationFn: async ({ userId, requestType, accessLevel }: { userId: string; requestType: string; accessLevel: string }) => {
      const response = await fetch("/api/biometric-access/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, requestType, accessLevel }),
      });
      if (!response.ok) throw new Error("Failed to enable biometric access");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-requests"] });
      setIsEnableDialogOpen(false);
      toast({
        title: "Success",
        description: "Biometric access enabled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to enable biometric access",
        variant: "destructive",
      });
    },
  });

  const disableBiometricMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch("/api/biometric-access/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!response.ok) throw new Error("Failed to disable biometric access");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-requests"] });
      toast({
        title: "Success",
        description: "Biometric access disabled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disable biometric access",
        variant: "destructive",
      });
    },
  });

  const handleEnableBiometric = (user: any) => {
    setSelectedUser(user);
    setIsEnableDialogOpen(true);
  };

  const handleDisableBiometric = (userId: string) => {
    disableBiometricMutation.mutate(userId);
  };

  const getBiometricStatus = (userId: string) => {
    const approvedRequest = biometricRequests.find((req: any) => 
      req.userId === userId && req.status === 'approved'
    );
    return approvedRequest || null;
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const biometricStatus = getBiometricStatus(user.id);
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "enabled" && biometricStatus) ||
                         (statusFilter === "disabled" && !biometricStatus);

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Biometric Access Management</h2>
          <p className="text-gray-600">Enable or disable biometric access for residents</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or flat number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="enabled">Biometric Enabled</SelectItem>
            <SelectItem value="disabled">Biometric Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers
          .filter((user: any) => user.role === 'resident')
          .map((user: any) => {
            const biometricStatus = getBiometricStatus(user.id);
            
            return (
              <Card key={user.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {user.firstName} {user.lastName}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {user.isOwner ? 'Owner' : 'Tenant'}
                          </Badge>
                          {biometricStatus && (
                            <Badge className={getStatusColor(biometricStatus.status)}>
                              <Fingerprint className="h-3 w-3 mr-1" />
                              {biometricStatus.requestType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {user.email} • Flat {user.unitNumber || 'Unassigned'}
                        </p>
                        {biometricStatus && (
                          <div className="text-xs text-gray-500">
                            <p>Access Level: {biometricStatus.accessLevel}</p>
                            <p>Approved: {format(new Date(biometricStatus.approvedDate), "MMM dd, yyyy")}</p>
                            {biometricStatus.expiryDate && (
                              <p>Expires: {format(new Date(biometricStatus.expiryDate), "MMM dd, yyyy")}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {biometricStatus ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisableBiometric(user.id)}
                          disabled={disableBiometricMutation.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleEnableBiometric(user)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Enable Biometric Dialog */}
      <Dialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Biometric Access</DialogTitle>
            <DialogDescription>
              Enable biometric access for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Request Type</label>
                <Select onValueChange={(value) => setSelectedUser({ ...selectedUser, requestType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fingerprint">Fingerprint</SelectItem>
                    <SelectItem value="facial">Facial Recognition</SelectItem>
                    <SelectItem value="card">Access Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Access Level</label>
                <Select onValueChange={(value) => setSelectedUser({ ...selectedUser, accessLevel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Access</SelectItem>
                    <SelectItem value="full">Full Access</SelectItem>
                    <SelectItem value="maintenance">Maintenance Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (selectedUser?.requestType && selectedUser?.accessLevel) {
                    enableBiometricMutation.mutate({
                      userId: selectedUser.id,
                      requestType: selectedUser.requestType,
                      accessLevel: selectedUser.accessLevel,
                    });
                  }
                }}
                disabled={!selectedUser?.requestType || !selectedUser?.accessLevel || enableBiometricMutation.isPending}
                className="flex-1"
              >
                {enableBiometricMutation.isPending ? "Enabling..." : "Enable Access"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEnableDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
