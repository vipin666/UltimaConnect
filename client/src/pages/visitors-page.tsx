import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Users, Plus, CheckCircle, XCircle, Clock, UserCheck, UserX, Download, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Visitor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  purpose: string;
  purposeDetails?: string;
  unitToVisit: string;
  hostUserId: string;
  photoUrl?: string;
  idProofType?: string;
  idProofNumber?: string;
  idProofPhotoUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out';
  checkInTime?: string;
  checkOutTime?: string;
  expectedDuration?: string;
  actualDuration?: string;
  verificationNotes?: string;
  watchmanId: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  emergencyContact?: string;
  vehicleNumber?: string;
  accompanyingPersons: number;
  createdAt: string;
  updatedAt: string;
  host: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    unitNumber: string | null;
  };
  watchman: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  verifiedByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export default function VisitorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  // Fetch visitors based on user role
  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
    enabled: !!user,
  });

  // Fetch pending visitors for notifications
  const { data: pendingVisitors = [] } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors/pending'],
    enabled: !!user && user.role !== 'watchman',
  });

  // Register visitor mutation (for watchman)
  const registerVisitorMutation = useMutation({
    mutationFn: async (visitorData: any) => {
      const res = await apiRequest("POST", "/api/visitors", visitorData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      setIsRegisterDialogOpen(false);
      toast({
        title: "Visitor registered",
        description: "Visitor has been registered and notification sent to the host.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify visitor mutation (for residents/admin)
  const verifyVisitorMutation = useMutation({
    mutationFn: async ({ id, action, notes }: { id: string; action: 'approve' | 'reject'; notes?: string }) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}/verify`, { action, notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors/pending'] });
      setIsVerifyDialogOpen(false);
      setSelectedVisitor(null);
      toast({
        title: "Visitor verified",
        description: "Visitor verification completed.",
      });
    },
  });

  // Check-in mutation (for watchman)
  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}/checkin`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      toast({
        title: "Visitor checked in",
        description: "Visitor has been checked in successfully.",
      });
    },
  });

  // Check-out mutation (for watchman)
  const checkOutMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/visitors/${id}/checkout`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      toast({
        title: "Visitor checked out",
        description: "Visitor has been checked out successfully.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      checked_in: "default",
      checked_out: "outline",
    } as const;

    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
      checked_in: <UserCheck className="w-3 h-3 mr-1" />,
      checked_out: <UserX className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {icons[status as keyof typeof icons]}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const downloadReport = async () => {
    try {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
      const endDate = new Date().toISOString();
      
      const response = await fetch(`/api/visitors/report?startDate=${startDate}&endDate=${endDate}&format=csv`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'visitor-report.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report downloaded",
        description: "Visitor report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download visitor report.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = "/"}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Visitor Management</h1>
            <p className="text-gray-600">
              {user?.role === 'watchman' 
                ? 'Register and manage visitor entries'
                : user?.role === 'admin' || user?.role === 'super_admin'
                ? 'View all visitors and download reports'
                : 'Verify visitors for your unit'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <Button onClick={downloadReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          )}
          {user?.role === 'watchman' && (
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Register Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Register New Visitor</DialogTitle>
                </DialogHeader>
                <VisitorRegistrationForm 
                  onSubmit={(data) => registerVisitorMutation.mutate(data)}
                  isLoading={registerVisitorMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {pendingVisitors.length > 0 && user?.role !== 'watchman' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              <Clock className="w-5 h-5 mr-2 inline" />
              Pending Verifications ({pendingVisitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              You have {pendingVisitors.length} visitor{pendingVisitors.length !== 1 ? 's' : ''} waiting for verification.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Visitors</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="checked_in">Checked In</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <VisitorList 
            visitors={visitors} 
            user={user}
            onVerify={(visitor) => {
              setSelectedVisitor(visitor);
              setIsVerifyDialogOpen(true);
            }}
            onCheckIn={(id) => checkInMutation.mutate(id)}
            onCheckOut={(id) => checkOutMutation.mutate(id)}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <VisitorList 
            visitors={visitors.filter((v: Visitor) => v.status === 'pending')} 
            user={user}
            onVerify={(visitor) => {
              setSelectedVisitor(visitor);
              setIsVerifyDialogOpen(true);
            }}
            onCheckIn={(id) => checkInMutation.mutate(id)}
            onCheckOut={(id) => checkOutMutation.mutate(id)}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <VisitorList 
            visitors={visitors.filter((v: Visitor) => v.status === 'approved')} 
            user={user}
            onVerify={(visitor) => {
              setSelectedVisitor(visitor);
              setIsVerifyDialogOpen(true);
            }}
            onCheckIn={(id) => checkInMutation.mutate(id)}
            onCheckOut={(id) => checkOutMutation.mutate(id)}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="checked_in" className="space-y-4">
          <VisitorList 
            visitors={visitors.filter((v: Visitor) => v.status === 'checked_in')} 
            user={user}
            onVerify={(visitor) => {
              setSelectedVisitor(visitor);
              setIsVerifyDialogOpen(true);
            }}
            onCheckIn={(id) => checkInMutation.mutate(id)}
            onCheckOut={(id) => checkOutMutation.mutate(id)}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Visitor</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <VisitorVerificationForm
              visitor={selectedVisitor}
              onVerify={(action, notes) => 
                verifyVisitorMutation.mutate({ 
                  id: selectedVisitor.id, 
                  action, 
                  notes 
                })
              }
              isLoading={verifyVisitorMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Visitor Registration Form Component
function VisitorRegistrationForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: '',
    purposeDetails: '',
    unitToVisit: '',
    hostUserId: '',
    photoUrl: '',
    idProofType: '',
    idProofNumber: '',
    idProofPhotoUrl: '',
    expectedDuration: '',
    emergencyContact: '',
    vehicleNumber: '',
    guestParkingSlot: 'none',
    accompanyingPersons: 0,
  });

  const { data: residents = [] } = useQuery<Array<{
    id: string;
    firstName: string;
    lastName: string;
    unitNumber: string;
  }>>({
    queryKey: ['/api/users/residents'],
  });

  const { data: units = [] } = useQuery<Array<{
    unitNumber: string;
  }>>({
    queryKey: ['/api/units'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the selected resident
    const selectedResident = residents.find((r: any) => r.id === formData.hostUserId);
    
    onSubmit({
      ...formData,
      guestParkingSlot: formData.guestParkingSlot === 'none' ? '' : formData.guestParkingSlot,
      accompanyingPersons: Number(formData.accompanyingPersons),
      unitToVisit: selectedResident?.unitNumber || formData.unitToVisit,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Visitor Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            data-testid="input-visitor-name"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            required
            data-testid="input-visitor-phone"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          data-testid="input-visitor-email"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purpose">Purpose *</Label>
          <Select
            value={formData.purpose}
            onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
          >
            <SelectTrigger data-testid="select-visitor-purpose">
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Visit</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="hostUserId">Visiting Resident *</Label>
          <Select
            value={formData.hostUserId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, hostUserId: value }))}
          >
            <SelectTrigger data-testid="select-host-resident">
              <SelectValue placeholder="Select resident" />
            </SelectTrigger>
            <SelectContent>
              {residents.map((resident) => (
                <SelectItem key={resident.id} value={resident.id}>
                  {resident.firstName} {resident.lastName} - Unit {resident.unitNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="purposeDetails">Purpose Details</Label>
        <Textarea
          id="purposeDetails"
          value={formData.purposeDetails}
          onChange={(e) => setFormData(prev => ({ ...prev, purposeDetails: e.target.value }))}
          data-testid="textarea-purpose-details"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="idProofType">ID Proof Type</Label>
          <Select
            value={formData.idProofType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, idProofType: value }))}
          >
            <SelectTrigger data-testid="select-id-proof-type">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aadhar">Aadhar Card</SelectItem>
              <SelectItem value="pan">PAN Card</SelectItem>
              <SelectItem value="license">Driving License</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="voter">Voter ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="idProofNumber">ID Proof Number</Label>
          <Input
            id="idProofNumber"
            value={formData.idProofNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, idProofNumber: e.target.value }))}
            data-testid="input-id-proof-number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expectedDuration">Expected Duration</Label>
          <Select
            value={formData.expectedDuration}
            onValueChange={(value) => setFormData(prev => ({ ...prev, expectedDuration: value }))}
          >
            <SelectTrigger data-testid="select-expected-duration">
              <SelectValue placeholder="Expected duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30 min">30 minutes</SelectItem>
              <SelectItem value="1 hour">1 hour</SelectItem>
              <SelectItem value="2 hours">2 hours</SelectItem>
              <SelectItem value="Half day">Half day</SelectItem>
              <SelectItem value="Full day">Full day</SelectItem>
              <SelectItem value="Multiple days">Multiple days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="accompanyingPersons">Accompanying Persons</Label>
          <Input
            id="accompanyingPersons"
            type="number"
            min="0"
            value={formData.accompanyingPersons}
            onChange={(e) => setFormData(prev => ({ ...prev, accompanyingPersons: parseInt(e.target.value) || 0 }))}
            data-testid="input-accompanying-persons"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="emergencyContact">Emergency Contact</Label>
          <Input
            id="emergencyContact"
            value={formData.emergencyContact}
            onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
            data-testid="input-emergency-contact"
          />
        </div>
        <div>
          <Label htmlFor="vehicleNumber">Vehicle Number</Label>
          <Input
            id="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
            data-testid="input-vehicle-number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unitToVisit">Unit to Visit</Label>
          <Select
            value={formData.unitToVisit}
            onValueChange={(value) => setFormData(prev => ({ ...prev, unitToVisit: value }))}
          >
            <SelectTrigger data-testid="select-unit-to-visit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit.unitNumber} value={unit.unitNumber}>
                  Unit {unit.unitNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="guestParkingSlot">Guest Parking Slot (Optional)</Label>
          <Select
            value={formData.guestParkingSlot}
            onValueChange={(value) => setFormData(prev => ({ ...prev, guestParkingSlot: value }))}
          >
            <SelectTrigger data-testid="select-guest-parking-slot">
              <SelectValue placeholder="Select parking slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Parking Required</SelectItem>
              <SelectItem value="slot1">Guest Parking Slot 1</SelectItem>
              <SelectItem value="slot2">Guest Parking Slot 2</SelectItem>
              <SelectItem value="slot3">Guest Parking Slot 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Visitor Photo</Label>
        <ObjectUploader
          onUploadComplete={(url) => setFormData(prev => ({ ...prev, photoUrl: url }))}
          accept="image/*"
          maxSizeMB={5}
        >
          <span>Upload Visitor Photo</span>
        </ObjectUploader>
        {formData.photoUrl && (
          <p className="text-sm text-green-600">Photo uploaded successfully</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>ID Proof Photo</Label>
        <ObjectUploader
          onUploadComplete={(url) => setFormData(prev => ({ ...prev, idProofPhotoUrl: url }))}
          accept="image/*"
          maxSizeMB={5}
        >
          <span>Upload ID Proof Photo</span>
        </ObjectUploader>
        {formData.idProofPhotoUrl && (
          <p className="text-sm text-green-600">ID proof photo uploaded successfully</p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading || !formData.name || !formData.phone || !formData.purpose || !formData.hostUserId}
        className="w-full"
        data-testid="button-register-visitor"
      >
        {isLoading ? 'Registering...' : 'Register Visitor'}
      </Button>
    </form>
  );
}

// Visitor Verification Form Component
function VisitorVerificationForm({ 
  visitor, 
  onVerify, 
  isLoading 
}: { 
  visitor: Visitor; 
  onVerify: (action: 'approve' | 'reject', notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Visitor Name</Label>
          <p className="font-medium" data-testid="text-visitor-name">{visitor.name}</p>
        </div>
        <div>
          <Label>Phone</Label>
          <p className="font-medium" data-testid="text-visitor-phone">{visitor.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purpose</Label>
          <p className="font-medium" data-testid="text-visitor-purpose">{visitor.purpose}</p>
        </div>
        <div>
          <Label>Unit to Visit</Label>
          <p className="font-medium" data-testid="text-visitor-unit">{visitor.unitToVisit}</p>
        </div>
      </div>

      {visitor.purposeDetails && (
        <div>
          <Label>Purpose Details</Label>
          <p className="text-sm text-gray-600" data-testid="text-purpose-details">{visitor.purposeDetails}</p>
        </div>
      )}

      {visitor.photoUrl && (
        <div>
          <Label>Visitor Photo</Label>
          <img 
            src={visitor.photoUrl} 
            alt="Visitor"
            className="w-32 h-32 object-cover rounded-md border"
            data-testid="img-visitor-photo"
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes">Verification Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the verification..."
          data-testid="textarea-verification-notes"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onVerify('approve', notes)}
          disabled={isLoading}
          className="flex-1"
          data-testid="button-approve-visitor"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Approve'}
        </Button>
        <Button
          onClick={() => onVerify('reject', notes)}
          disabled={isLoading}
          variant="destructive"
          className="flex-1"
          data-testid="button-reject-visitor"
        >
          <XCircle className="w-4 h-4 mr-2" />
          {isLoading ? 'Processing...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
}

// Visitor List Component
function VisitorList({ 
  visitors, 
  user, 
  onVerify, 
  onCheckIn, 
  onCheckOut, 
  getStatusBadge 
}: {
  visitors: Visitor[];
  user: any;
  onVerify: (visitor: Visitor) => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  if (visitors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No visitors found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {visitors.map((visitor) => (
        <Card key={visitor.id} data-testid={`card-visitor-${visitor.id}`}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg" data-testid={`text-visitor-name-${visitor.id}`}>
                  {visitor.name}
                </h3>
                <p className="text-sm text-gray-600" data-testid={`text-visitor-phone-${visitor.id}`}>
                  {visitor.phone}
                </p>
              </div>
              {getStatusBadge(visitor.status)}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <Label className="text-xs text-gray-500">Purpose</Label>
                <p className="text-sm" data-testid={`text-visitor-purpose-${visitor.id}`}>
                  {visitor.purpose}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Unit</Label>
                <p className="text-sm" data-testid={`text-visitor-unit-${visitor.id}`}>
                  {visitor.unitToVisit}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Host</Label>
                <p className="text-sm" data-testid={`text-visitor-host-${visitor.id}`}>
                  {visitor.host.firstName} {visitor.host.lastName}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Registered</Label>
                <p className="text-sm" data-testid={`text-visitor-date-${visitor.id}`}>
                  {format(new Date(visitor.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            {visitor.checkInTime && (
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Check In</Label>
                  <p data-testid={`text-checkin-time-${visitor.id}`}>
                    {format(new Date(visitor.checkInTime), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                {visitor.checkOutTime && (
                  <div>
                    <Label className="text-xs text-gray-500">Check Out</Label>
                    <p data-testid={`text-checkout-time-${visitor.id}`}>
                      {format(new Date(visitor.checkOutTime), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {/* Verification buttons for residents and admins */}
              {visitor.status === 'pending' && 
               (user?.role === 'admin' || user?.role === 'super_admin' || visitor.hostUserId === user?.id) && (
                <Button
                  size="sm"
                  onClick={() => onVerify(visitor)}
                  data-testid={`button-verify-${visitor.id}`}
                >
                  Verify
                </Button>
              )}

              {/* Check-in button for watchman */}
              {visitor.status === 'approved' && user?.role === 'watchman' && (
                <Button
                  size="sm"
                  onClick={() => onCheckIn(visitor.id)}
                  data-testid={`button-checkin-${visitor.id}`}
                >
                  <UserCheck className="w-4 h-4 mr-1" />
                  Check In
                </Button>
              )}

              {/* Check-out button for watchman */}
              {visitor.status === 'checked_in' && user?.role === 'watchman' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCheckOut(visitor.id)}
                  data-testid={`button-checkout-${visitor.id}`}
                >
                  <UserX className="w-4 h-4 mr-1" />
                  Check Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}