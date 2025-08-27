import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Home, Building } from "lucide-react";

const flatFormSchema = z.object({
  flatNumber: z.string().min(1, "Flat number is required"),
  floorNumber: z.number().min(1, "Floor number must be at least 1"),
  type: z.enum(["apartment", "penthouse", "studio"]),
  bedrooms: z.number().min(1, "Must have at least 1 bedroom"),
  bathrooms: z.number().min(1, "Must have at least 1 bathroom"),
  area: z.number().optional(),
  rentAmount: z.number().optional(),
});

const assignFlatSchema = z.object({
  userId: z.string().min(1, "User is required"),
  isOwner: z.boolean(),
});

type FlatFormData = z.infer<typeof flatFormSchema>;
type AssignFlatData = z.infer<typeof assignFlatSchema>;

export function FlatManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFlat, setSelectedFlat] = useState<any>(null);

  const { data: flats = [], isLoading } = useQuery({
    queryKey: ["/api/flats"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const flatForm = useForm<FlatFormData>({
    resolver: zodResolver(flatFormSchema),
    defaultValues: {
      flatNumber: "",
      floorNumber: 1,
      type: "apartment",
      bedrooms: 1,
      bathrooms: 1,
      area: undefined,
      rentAmount: undefined,
    },
  });

  const assignForm = useForm<AssignFlatData>({
    resolver: zodResolver(assignFlatSchema),
    defaultValues: {
      userId: "",
      isOwner: false,
    },
  });

  const createFlatMutation = useMutation({
    mutationFn: async (data: FlatFormData) => {
      const response = await fetch("/api/flats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create flat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flats"] });
      flatForm.reset();
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Flat created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create flat",
        variant: "destructive",
      });
    },
  });

  const deleteFlatMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/flats/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete flat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flats"] });
      toast({
        title: "Success",
        description: "Flat deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete flat",
        variant: "destructive",
      });
    },
  });

  const assignFlatMutation = useMutation({
    mutationFn: async ({ flatId, data }: { flatId: string; data: AssignFlatData }) => {
      const response = await fetch(`/api/flats/${flatId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to assign flat");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/flats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      assignForm.reset();
      setIsAssignDialogOpen(false);
      toast({
        title: "Success",
        description: "Flat assigned successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign flat",
        variant: "destructive",
      });
    },
  });

  const onSubmitFlat = (data: FlatFormData) => {
    createFlatMutation.mutate(data);
  };

  const onSubmitAssign = (data: AssignFlatData) => {
    if (selectedFlat) {
      assignFlatMutation.mutate({ flatId: selectedFlat.id, data });
    }
  };

  const handleAssignFlat = (flat: any) => {
    setSelectedFlat(flat);
    setIsAssignDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'penthouse':
        return <Building className="h-4 w-4" />;
      case 'studio':
        return <Home className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold">Flat Management</h2>
          <p className="text-gray-600">Manage building flats and assign residents</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Flat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Flat</DialogTitle>
              <DialogDescription>
                Create a new flat in the building
              </DialogDescription>
            </DialogHeader>
            <Form {...flatForm}>
              <form onSubmit={flatForm.handleSubmit(onSubmitFlat)} className="space-y-4">
                <FormField
                  control={flatForm.control}
                  name="flatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., A101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={flatForm.control}
                  name="floorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={flatForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flat Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select flat type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="penthouse">Penthouse</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={flatForm.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bedrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={flatForm.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bathrooms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={flatForm.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area (sq ft)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={flatForm.control}
                    name="rentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rent Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createFlatMutation.isPending}
                    className="flex-1"
                  >
                    {createFlatMutation.isPending ? "Creating..." : "Create Flat"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flats List */}
      <div className="grid gap-4">
        {flats.map((flat: any) => (
          <Card key={flat.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getTypeIcon(flat.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Flat {flat.flatNumber}</h4>
                      <Badge className={getStatusColor(flat.status)}>
                        {flat.status.charAt(0).toUpperCase() + flat.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Floor {flat.floorNumber} • {flat.type.charAt(0).toUpperCase() + flat.type.slice(1)}
                    </p>
                    <p className="text-sm">
                      {flat.bedrooms} bed, {flat.bathrooms} bath
                      {flat.area && ` • ${flat.area} sq ft`}
                      {flat.rentAmount && ` • ₹${flat.rentAmount}/month`}
                    </p>
                    {flat.ownerFirstName && (
                      <p className="text-sm text-gray-600">
                        Owner: {flat.ownerFirstName} {flat.ownerLastName}
                      </p>
                    )}
                    {flat.residentCount > 0 && (
                      <p className="text-sm text-gray-600">
                        {flat.residentCount} resident{flat.residentCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAssignFlat(flat)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteFlatMutation.mutate(flat.id)}
                    disabled={deleteFlatMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Flat Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Flat</DialogTitle>
            <DialogDescription>
              Assign {selectedFlat?.flatNumber} to a resident
            </DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-4">
              <FormField
                control={assignForm.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Resident</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resident" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users
                          .filter((user: any) => user.role === 'resident')
                          .map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.unitNumber || 'Unassigned'})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={assignForm.control}
                name="isOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resident Type</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'true')} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select resident type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Owner</SelectItem>
                        <SelectItem value="false">Tenant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={assignFlatMutation.isPending}
                  className="flex-1"
                >
                  {assignFlatMutation.isPending ? "Assigning..." : "Assign Flat"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
