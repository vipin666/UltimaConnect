import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Search, Filter, Calendar, User, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  unitNumber: string;
  userId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function MaintenanceManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [flatFilter, setFlatFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const { data: requests, isLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['/api/maintenance-requests'],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, updates }: { requestId: string; updates: Partial<MaintenanceRequest> }) => {
      return apiRequest('PATCH', `/api/maintenance-requests/${requestId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-requests'] });
      toast({
        title: "Success",
        description: "Maintenance request updated successfully",
      });
      setIsDetailDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update maintenance request",
        variant: "destructive",
      });
    },
  });

  // Filter and search requests
  const filteredRequests = requests?.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = request.title.toLowerCase().includes(searchLower) ||
                         request.description.toLowerCase().includes(searchLower) ||
                         request.unitNumber.toLowerCase().includes(searchLower) ||
                         (request.user?.firstName + ' ' + request.user?.lastName).toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;
    const matchesFlat = flatFilter === 'all' || request.unitNumber === flatFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesFlat;
  }) || [];

  // Group requests by flat number
  const groupedRequests = filteredRequests.reduce((groups, request) => {
    const flatNumber = request.unitNumber;
    if (!groups[flatNumber]) {
      groups[flatNumber] = [];
    }
    groups[flatNumber].push(request);
    return groups;
  }, {} as Record<string, typeof filteredRequests>);

  // Sort flat numbers
  const sortedFlatNumbers = Object.keys(groupedRequests).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, ''));
    const bNum = parseInt(b.replace(/\D/g, ''));
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  });

  const handleUpdateRequest = (requestId: string, updates: Partial<MaintenanceRequest>) => {
    updateRequestMutation.mutate({ requestId, updates });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'plumbing': return '🚰';
      case 'electrical': return '⚡';
      case 'hvac': return '❄️';
      case 'appliance': return '🔧';
      case 'structural': return '🏗️';
      case 'pest control': return '🐜';
      case 'cleaning': return '🧹';
      default: return '🔧';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Management</h2>
          <p className="text-gray-600">Manage maintenance requests for all flats</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{filteredRequests.length} requests</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="appliance">Appliance</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="pest control">Pest Control</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
              </SelectContent>
            </Select>

            <Select value={flatFilter} onValueChange={setFlatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Flat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flats</SelectItem>
                {requests?.map(request => request.unitNumber)
                  .filter((value, index, self) => self.indexOf(value) === index)
                  .sort((a, b) => {
                    const aNum = parseInt(a.replace(/\D/g, ''));
                    const bNum = parseInt(b.replace(/\D/g, ''));
                    if (aNum !== bNum) return aNum - bNum;
                    return a.localeCompare(b);
                  })
                  .map(flatNumber => (
                    <SelectItem key={flatNumber} value={flatNumber}>
                      {flatNumber}
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
                setPriorityFilter('all');
                setCategoryFilter('all');
                setFlatFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Maintenance Requests ({filteredRequests.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading maintenance requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No maintenance requests found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedFlatNumbers.map((flatNumber) => (
                <div key={flatNumber} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>Flat {flatNumber}</span>
                      <Badge variant="outline">{groupedRequests[flatNumber].length} {groupedRequests[flatNumber].length === 1 ? 'request' : 'requests'}</Badge>
                    </h3>
                  </div>
                  <div className="divide-y">
                    {groupedRequests[flatNumber].map((request) => (
                      <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {getCategoryIcon(request.category)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg">{request.title}</h4>
                                <p className="text-gray-600 text-sm line-clamp-2">{request.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant={getStatusBadgeVariant(request.status)}>
                                  {request.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant={getPriorityBadgeVariant(request.priority)}>
                                  {request.priority}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">By:</span> {request.user?.firstName} {request.user?.lastName}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">Created:</span> {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {request.category}
                              </div>
                              {request.assignedTo && (
                                <div>
                                  <span className="font-medium">Assigned:</span> {request.assignedTo}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsDetailDialogOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <RequestDetailForm
              request={selectedRequest}
              onUpdate={handleUpdateRequest}
              onCancel={() => {
                setIsDetailDialogOpen(false);
                setSelectedRequest(null);
              }}
              isLoading={updateRequestMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RequestDetailFormProps {
  request: MaintenanceRequest;
  onUpdate: (requestId: string, updates: Partial<MaintenanceRequest>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RequestDetailForm({ request, onUpdate, onCancel, isLoading }: RequestDetailFormProps) {
  const [formData, setFormData] = useState({
    status: request.status,
    priority: request.priority,
    assignedTo: request.assignedTo || '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(request.id, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Request Information */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Title</Label>
          <p className="text-lg font-semibold">{request.title}</p>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-gray-700">Description</Label>
          <p className="text-gray-600">{request.description}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Flat Number</Label>
            <p className="text-gray-600">{request.unitNumber}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Category</Label>
            <p className="text-gray-600">{request.category}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Requested By</Label>
            <p className="text-gray-600">{request.user?.firstName} {request.user?.lastName}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Created</Label>
            <p className="text-gray-600">{format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Update Request</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="assignedTo">Assign To</Label>
          <Input
            id="assignedTo"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            placeholder="Enter assignee name"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Add any additional notes..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Request'}
        </Button>
      </div>
    </form>
  );
}
