import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, User, Building, FileText, Crown, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommitteeMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  unitNumber: string | null;
  username: string;
}

const roleIcons = {
  caretaker: Building,
  secretary: FileText,
  president: Crown,
  treasurer: DollarSign,
  committee_member: User,
};

const roleColors = {
  caretaker: "bg-blue-100 text-blue-800 border-blue-200",
  secretary: "bg-green-100 text-green-800 border-green-200",
  president: "bg-purple-100 text-purple-800 border-purple-200",
  treasurer: "bg-orange-100 text-orange-800 border-orange-200",
  committee_member: "bg-gray-100 text-gray-800 border-gray-200",
};

const roleOptions = [
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'president', label: 'President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'committee_member', label: 'Committee Member' },
];

export function CommitteeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    role: '',
    unitNumber: '',
  });

  const { data: committeeMembers = [], isLoading } = useQuery<CommitteeMember[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      const users = await response.json();
      return users.filter((user: CommitteeMember) => 
        ['caretaker', 'secretary', 'president', 'treasurer', 'committee_member'].includes(user.role)
      );
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Committee member added",
        description: "New committee member has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add member",
        description: error.message || "An error occurred while adding the member.",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setEditingMember(null);
      resetForm();
      toast({
        title: "Committee member updated",
        description: "Committee member has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update member",
        description: error.message || "An error occurred while updating the member.",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Committee member deleted",
        description: "Committee member has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete member",
        description: error.message || "An error occurred while deleting the member.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      role: '',
      unitNumber: '',
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMemberMutation.mutate({
      ...formData,
      password: 'committee123', // Default password
      status: 'active',
      isOwner: false,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMemberMutation.mutate({
        id: editingMember.id,
        data: formData,
      });
    }
  };

  const handleEdit = (member: CommitteeMember) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      username: member.username || '',
      email: member.email || '',
      phone: member.phone || '',
      role: member.role || '',
      unitNumber: member.unitNumber || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (member: CommitteeMember) => {
    if (confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}?`)) {
      deleteMemberMutation.mutate(member.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-800">Committee Management</h3>
          <p className="text-sm text-gray-600">Manage committee members and their roles</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Committee Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unitNumber">Unit/Office</Label>
                <Input
                  id="unitNumber"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  placeholder="e.g., Office, Unit 101"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={addMemberMutation.isPending} className="flex-1">
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Committee Members List */}
      <div className="space-y-3">
        {committeeMembers.map((member) => {
          const IconComponent = roleIcons[member.role as keyof typeof roleIcons] || User;
          const colorClass = roleColors[member.role as keyof typeof roleColors] || roleColors.committee_member;
          
          return (
            <Card key={member.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-800">
                          {member.firstName} {member.lastName}
                        </h4>
                        <Badge className={`text-xs ${colorClass}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {member.username && <p>Username: {member.username}</p>}
                        {member.email && <p>Email: {member.email}</p>}
                        {member.phone && <p>Phone: {member.phone}</p>}
                        {member.unitNumber && <p>Location: {member.unitNumber}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(member)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Committee Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editUsername">Username</Label>
              <Input
                id="editUsername"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editUnitNumber">Unit/Office</Label>
              <Input
                id="editUnitNumber"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="e.g., Office, Unit 101"
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit" disabled={updateMemberMutation.isPending} className="flex-1">
                {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
