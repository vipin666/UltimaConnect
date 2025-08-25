import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Fingerprint, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const requestFormSchema = z.object({
  requestType: z.enum(["fingerprint", "facial", "card"]),
  reason: z.string().min(10, "Please provide a detailed reason"),
  accessLevel: z.enum(["basic", "full", "maintenance"]).default("basic"),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

export function BiometricAccessTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["/api/biometric-requests"],
  });

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      requestType: "fingerprint",
      accessLevel: "basic",
      reason: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const response = await fetch("/api/biometric-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-requests"] });
      form.reset();
      setShowNewRequestForm(false);
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await fetch(`/api/biometric-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-requests"] });
    },
  });

  const onSubmit = (data: RequestFormData) => {
    createRequestMutation.mutate(data);
  };

  const handleApproval = (requestId: string, status: 'approved' | 'rejected', adminNotes?: string) => {
    updateRequestMutation.mutate({
      id: requestId,
      updates: { status, adminNotes },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'fingerprint':
        return <Fingerprint className="h-4 w-4" />;
      case 'facial':
        return <Shield className="h-4 w-4" />;
      case 'card':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
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

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Biometric Access</h2>
          <p className="text-gray-600">Manage biometric access requests for enhanced security</p>
        </div>
        {!isAdmin && (
          <Button 
            onClick={() => setShowNewRequestForm(!showNewRequestForm)}
            data-testid="button-new-request"
          >
            New Request
          </Button>
        )}
      </div>

      {/* New Request Form */}
      {showNewRequestForm && !isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Request Biometric Access</CardTitle>
            <CardDescription>
              Submit a request for biometric access to building facilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-request-type">
                            <SelectValue placeholder="Select access type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fingerprint">Fingerprint Access</SelectItem>
                          <SelectItem value="facial">Facial Recognition</SelectItem>
                          <SelectItem value="card">Access Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-access-level">
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">Basic Access (Common Areas)</SelectItem>
                          <SelectItem value="full">Full Access (All Amenities)</SelectItem>
                          <SelectItem value="maintenance">Maintenance Access (Staff Only)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Request</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why you need biometric access..."
                          {...field}
                          data-testid="textarea-reason"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createRequestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewRequestForm(false)}
                    data-testid="button-cancel-request"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {isAdmin ? "All Access Requests" : "Your Access Requests"}
        </h3>
        
        {requests && Array.isArray(requests) && requests.length > 0 ? (
          requests.map((request: any) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getRequestTypeIcon(request.requestType)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} Access
                        </h4>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </div>
                        </Badge>
                      </div>
                      {isAdmin && (
                        <p className="text-sm text-gray-600">
                          Requested by: {request.user?.firstName} {request.user?.lastName} (Unit {request.user?.unitNumber})
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Access Level:</span> {request.accessLevel}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested on {format(new Date(request.requestDate), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                      {request.adminNotes && (
                        <p className="text-sm">
                          <span className="font-medium">Admin Notes:</span> {request.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproval(request.id, 'approved')}
                        disabled={updateRequestMutation.isPending}
                        data-testid={`button-approve-${request.id}`}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApproval(request.id, 'rejected')}
                        disabled={updateRequestMutation.isPending}
                        data-testid={`button-reject-${request.id}`}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Requests</h3>
                <p className="text-gray-600">
                  {isAdmin ? "No biometric access requests have been submitted yet." : "You haven't submitted any biometric access requests yet."}
                </p>
                {!isAdmin && (
                  <Button
                    className="mt-4"
                    onClick={() => setShowNewRequestForm(true)}
                    data-testid="button-create-first-request"
                  >
                    Submit Your First Request
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}