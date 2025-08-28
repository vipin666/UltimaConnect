import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Edit, Trash2, Phone, MapPin, Search, Filter } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  phone: string;
  description: string;
  address: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const serviceCategories = [
  'ironing', 'milk', 'internet', 'cable', 'electrician', 'plumbing', 'carpenter',
  'appliance-repair', 'RO/water-purifier', 'gas/stove-service', 'pest-control',
  'painter', 'AC-service', 'laundry', 'tiffin/meal-service', 'maid/cook', 'driver',
  'auto/taxi', 'courier', 'pharmacy', 'clinic', 'hospital', 'pathology',
  'fruits-vegetables', 'grocery', 'bakery', 'stationery', 'mobile-repair',
  'hardware', 'photo-copy/print', 'salon/parlour', 'temple/church/mosque', 'bank/atm'
];

const categoryLabels: Record<string, string> = {
  'ironing': 'Ironing Services',
  'milk': 'Milk Services',
  'internet': 'Internet Services',
  'cable': 'Cable/DTH Services',
  'electrician': 'Electrician',
  'plumbing': 'Plumbing',
  'carpenter': 'Carpenter',
  'appliance-repair': 'Appliance Repair',
  'RO/water-purifier': 'RO/Water Purifier',
  'gas/stove-service': 'Gas/Stove Service',
  'pest-control': 'Pest Control',
  'painter': 'Painter',
  'AC-service': 'AC Service',
  'laundry': 'Laundry',
  'tiffin/meal-service': 'Tiffin/Meal Service',
  'maid/cook': 'Maid/Cook',
  'driver': 'Driver',
  'auto/taxi': 'Auto/Taxi',
  'courier': 'Courier',
  'pharmacy': 'Pharmacy',
  'clinic': 'Clinic',
  'hospital': 'Hospital',
  'pathology': 'Pathology',
  'fruits-vegetables': 'Fruits & Vegetables',
  'grocery': 'Grocery',
  'bakery': 'Bakery',
  'stationery': 'Stationery',
  'mobile-repair': 'Mobile Repair',
  'hardware': 'Hardware',
  'photo-copy/print': 'Photo Copy/Print',
  'salon/parlour': 'Salon/Parlour',
  'temple/church/mosque': 'Temple/Church/Mosque',
  'bank/atm': 'Bank/ATM'
};

export default function ServicesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  const createServiceMutation = useMutation({
    mutationFn: (serviceData: Partial<Service>) =>
      apiRequest('/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsAddDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Service created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      apiRequest(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setIsEditDialogOpen(false);
      setEditingService(null);
      toast({
        title: 'Success',
        description: 'Service updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive',
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/services/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({
        title: 'Success',
        description: 'Service deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      });
    },
  });

  const filteredServices = services.filter((service: Service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.phone.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Nearby Services Management</h2>
          <p className="text-muted-foreground">Manage services available to residents</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Add a new nearby service for residents</DialogDescription>
            </DialogHeader>
            <AddServiceForm
              onSubmit={(data) => createServiceMutation.mutate(data)}
              isLoading={createServiceMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {serviceCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryLabels[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service: Service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {categoryLabels[service.category]}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{service.description}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{service.address}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{service.phone}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCall(service.phone)}
                >
                  Call
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Distance: {service.distanceKm} km
                </span>
                <span className="text-muted-foreground">
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No services found</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Update service information</DialogDescription>
          </DialogHeader>
          {editingService && (
            <EditServiceForm
              service={editingService}
              onSubmit={(data) => updateServiceMutation.mutate({ id: editingService.id, data })}
              isLoading={updateServiceMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ServiceFormProps {
  onSubmit: (data: Partial<Service>) => void;
  isLoading: boolean;
  service?: Service;
}

function AddServiceForm({ onSubmit, isLoading }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    phone: '',
    description: '',
    address: '',
    distanceKm: '',
    latitude: '',
    longitude: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      distanceKm: parseFloat(formData.distanceKm) || 0,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Service Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="distanceKm">Distance (km)</Label>
          <Input
            id="distanceKm"
            type="number"
            step="0.1"
            value={formData.distanceKm}
            onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Service'}
        </Button>
      </div>
    </form>
  );
}

function EditServiceForm({ service, onSubmit, isLoading }: ServiceFormProps & { service: Service }) {
  const [formData, setFormData] = useState({
    name: service.name,
    category: service.category,
    phone: service.phone,
    description: service.description,
    address: service.address,
    distanceKm: service.distanceKm.toString(),
    latitude: service.latitude.toString(),
    longitude: service.longitude.toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      distanceKm: parseFloat(formData.distanceKm) || 0,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Service Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabels[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-phone">Phone Number</Label>
          <Input
            id="edit-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-distanceKm">Distance (km)</Label>
          <Input
            id="edit-distanceKm"
            type="number"
            step="0.1"
            value={formData.distanceKm}
            onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-address">Address</Label>
        <Input
          id="edit-address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-latitude">Latitude</Label>
          <Input
            id="edit-latitude"
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-longitude">Longitude</Label>
          <Input
            id="edit-longitude"
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Service'}
        </Button>
      </div>
    </form>
  );
}
