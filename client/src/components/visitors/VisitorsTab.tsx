import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, Plus, CheckCircle, XCircle, Clock, UserCheck, UserX } from "lucide-react";
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
  guestParkingSlot?: string;
  arrivalTime?: string;
  departureTime?: string;
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

export function VisitorsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);

  // Fetch visitors based on user role (including guest parking bookings for watchman)
  const { data: visitors = [], isLoading } = useQuery<Visitor[]>({
    queryKey: user?.role === 'watchman' ? ['/api/visitors/enhanced'] : ['/api/visitors'],
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Visitor Management</h2>
            <p className="text-gray-600 text-sm">
              {user?.role === 'watchman' 
                ? 'Register and manage visitor entries'
                : user?.role === 'admin' || user?.role === 'super_admin'
                ? 'View all visitors'
                : 'Verify visitors for your unit'
              }
            </p>
          </div>
                     {(user?.role === 'watchman' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'resident') && (
            <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {user?.role === 'resident' ? 'Add Visitor' : 'Register'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {user?.role === 'resident' ? 'Register Visitor for Your Unit' : 'Register New Visitor'}
                  </DialogTitle>
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

       {/* Vehicle and Parking Overview for Watchmen */}
       {user?.role === 'watchman' && (
         <div className="px-4">
           <Card className="border-blue-200 bg-blue-50">
             <CardHeader className="pb-3">
               <CardTitle className="text-blue-800 text-lg flex items-center">
                 🚗 Vehicle & Parking Overview
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                                   {Array.isArray(visitors) ? visitors.filter(v => v.vehicleNumber || v.guestParkingSlot).slice(0, 5).map((visitor) => (
                    <div key={visitor.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{visitor.name}</p>
                        <p className="text-xs text-gray-600">Unit {visitor.unitToVisit}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {visitor.vehicleNumber && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              🚗 {visitor.vehicleNumber}
                            </Badge>
                          )}
                          {visitor.guestParkingSlot && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              🅿️ {visitor.guestParkingSlot}
                            </Badge>
                          )}
                          <Badge className={`text-xs ${
                            visitor.status === 'approved' ? 'bg-green-100 text-green-800' :
                            visitor.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {visitor.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {format(new Date(visitor.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  )) : null}
                 {Array.isArray(visitors) && visitors.filter(v => v.vehicleNumber || v.guestParkingSlot).length === 0 && (
                   <p className="text-sm text-blue-700 text-center py-4">
                     No vehicles registered yet
                   </p>
                 )}
               </div>
             </CardContent>
           </Card>
         </div>
       )}

       {/* Pending Visitors Alert */}
      {Array.isArray(pendingVisitors) && pendingVisitors.length > 0 && user?.role !== 'watchman' && (
        <div className="px-4">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 text-lg">
                Pending Visitors ({pendingVisitors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                                 {Array.isArray(pendingVisitors) ? pendingVisitors.slice(0, 3).map((visitor) => (
                   <div key={visitor.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                     <div>
                       <p className="font-medium">{visitor.name}</p>
                       <p className="text-sm text-gray-600">Unit {visitor.unitToVisit}</p>
                     </div>
                     <Button
                       size="sm"
                       onClick={() => {
                         setSelectedVisitor(visitor);
                         setIsVerifyDialogOpen(true);
                       }}
                     >
                       Verify
                     </Button>
                   </div>
                 )) : null}
                {Array.isArray(pendingVisitors) && pendingVisitors.length > 3 && (
                  <p className="text-sm text-orange-700">
                    +{pendingVisitors.length - 3} more pending visitors
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visitors List */}
      <div className="px-4">
        <h3 className="text-lg font-medium mb-3">
          {user?.role === 'watchman' ? 'Recent Visitors & Guest Parking' : 'Recent Visitors'}
        </h3>
        <div className="space-y-3">
          {Array.isArray(visitors) ? visitors.slice(0, 10).map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{item.name || `${item.firstName} ${item.lastName}`}</h4>
                      {item.type === 'guest_parking' ? (
                        <Badge className={`text-xs ${
                          item.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'confirmed' ? 'Approved' : item.status}
                        </Badge>
                      ) : (
                        getStatusBadge(item.status)
                      )}
                      {item.type === 'guest_parking' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          🅿️ Guest Parking
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {item.type === 'guest_parking' 
                        ? `Unit ${item.unitNumber} • ${item.amenityName} • ${new Date(item.bookingDate).toLocaleDateString()}`
                        : `Unit ${item.unitToVisit} • ${item.purpose}`
                      }
                    </p>
                     
                     {/* Enhanced Vehicle Information for Watchmen */}
                     {(item.vehicleNumber || item.guestParkingSlot || item.arrivalTime || item.departureTime || item.type === 'guest_parking') && (
                       <div className="bg-blue-50 p-2 rounded-lg mb-2">
                         <div className="flex items-center space-x-2 mb-1">
                           <span className="text-xs font-medium text-blue-700">
                             {item.type === 'guest_parking' ? 'Parking Details:' : 'Visit Details:'}
                           </span>
                         </div>
                         <div className="space-y-1">
                           {item.vehicleNumber && (
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-blue-600">🚗</span>
                               <span className="text-xs font-medium">{item.vehicleNumber}</span>
                             </div>
                           )}
                           {item.guestParkingSlot && (
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-blue-600">🅿️</span>
                               <span className="text-xs font-medium">Parking: {item.guestParkingSlot}</span>
                             </div>
                           )}
                           {item.type === 'guest_parking' && (
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-blue-600">📅</span>
                               <span className="text-xs font-medium">Date: {new Date(item.bookingDate).toLocaleDateString()}</span>
                             </div>
                           )}
                           {item.arrivalTime && (
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-blue-600">🕐</span>
                               <span className="text-xs font-medium">Arrival: {format(new Date(item.arrivalTime), 'MMM dd, HH:mm')}</span>
                             </div>
                           )}
                           {item.departureTime && (
                             <div className="flex items-center space-x-2">
                               <span className="text-xs text-blue-600">🕔</span>
                               <span className="text-xs font-medium">Departure: {format(new Date(item.departureTime), 'MMM dd, HH:mm')}</span>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                     
                     <p className="text-xs text-gray-500">
                       {format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}
                     </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Only show action buttons for visitors, not guest parking bookings */}
                    {item.type !== 'guest_parking' && (user?.role === 'watchman' || user?.role === 'admin' || user?.role === 'super_admin') && (
                      <>
                        {item.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => checkInMutation.mutate(item.id)}
                            disabled={checkInMutation.isPending}
                          >
                            Check In
                          </Button>
                        )}
                        {item.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => checkOutMutation.mutate(item.id)}
                            disabled={checkOutMutation.isPending}
                          >
                            Check Out
                          </Button>
                        )}
                      </>
                    )}
                                         {user?.role !== 'watchman' && user?.role !== 'admin' && user?.role !== 'super_admin' && visitor.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setIsVerifyDialogOpen(true);
                        }}
                      >
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : null}
        </div>
      </div>

      {/* Verify Visitor Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Visitor</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{selectedVisitor.name}</p>
                <p className="text-sm text-gray-600">Unit {selectedVisitor.unitToVisit}</p>
                <p className="text-sm text-gray-600">{selectedVisitor.purpose}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => verifyVisitorMutation.mutate({ 
                    id: selectedVisitor.id, 
                    action: 'approve' 
                  })}
                  disabled={verifyVisitorMutation.isPending}
                  className="flex-1"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => verifyVisitorMutation.mutate({ 
                    id: selectedVisitor.id, 
                    action: 'reject' 
                  })}
                  disabled={verifyVisitorMutation.isPending}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple Visitor Registration Form Component
function VisitorRegistrationForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    unitToVisit: '',
    hostUserId: '',
    expectedDuration: '2',
    vehicleNumber: '',
    guestParkingSlot: 'none',
    accompanyingPersons: 0,
    arrivalTime: '',
    departureTime: '',
  });

  // Fetch all residents for unit selection
  const { data: residents = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleUnitChange = (unitNumber: string) => {
    const selectedResident = Array.isArray(residents) ? residents.find(r => r.unitNumber === unitNumber) : null;
    setFormData({ 
      ...formData, 
      unitToVisit: unitNumber,
      hostUserId: selectedResident?.id || ''
    });
  };

  // Initialize form data for residents
  useEffect(() => {
    if (user?.role === 'resident' && user?.unitNumber) {
      setFormData(prev => ({
        ...prev,
        unitToVisit: user.unitNumber || '',
        hostUserId: user.id
      }));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert "none" to empty string for backend
    const submitData = {
      ...formData,
      guestParkingSlot: formData.guestParkingSlot === 'none' ? '' : formData.guestParkingSlot
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Visitor Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="purpose">Purpose of Visit</Label>
        <Input
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="unitToVisit">Unit to Visit</Label>
        {user?.role === 'resident' ? (
          <Input
            value={user.unitNumber || ''}
            disabled
            className="bg-gray-100"
          />
        ) : (
          <Select value={formData.unitToVisit} onValueChange={handleUnitChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(residents) ? residents
                .filter(r => r.role === 'resident' && r.unitNumber)
                .sort((a, b) => {
                  const aNum = parseInt(a.unitNumber.replace(/\D/g, ''));
                  const bNum = parseInt(b.unitNumber.replace(/\D/g, ''));
                  return aNum - bNum;
                })
                .map(resident => (
                  <SelectItem key={resident.id} value={resident.unitNumber}>
                    {resident.unitNumber} - {resident.firstName} {resident.lastName}
                  </SelectItem>
                )) : []
              }
            </SelectContent>
          </Select>
        )}
      </div>
             <div>
         <Label htmlFor="expectedDuration">Expected Duration (hours)</Label>
         <Select value={formData.expectedDuration} onValueChange={(value) => setFormData({ ...formData, expectedDuration: value })}>
           <SelectTrigger>
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="1">1 hour</SelectItem>
             <SelectItem value="2">2 hours</SelectItem>
             <SelectItem value="4">4 hours</SelectItem>
             <SelectItem value="8">8 hours</SelectItem>
           </SelectContent>
         </Select>
       </div>
       
       {/* Optional Vehicle Information */}
       <div className="space-y-3">
         <h4 className="text-sm font-medium text-gray-700">Vehicle Information (Optional)</h4>
         <div>
           <Label htmlFor="vehicleNumber">Vehicle Number</Label>
           <Input
             id="vehicleNumber"
             value={formData.vehicleNumber}
             onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
             placeholder="e.g., MH-12-AB-1234"
           />
         </div>
         <div>
           <Label htmlFor="guestParkingSlot">Guest Parking Slot (Optional)</Label>
           <Select value={formData.guestParkingSlot} onValueChange={(value) => setFormData({ ...formData, guestParkingSlot: value })}>
             <SelectTrigger>
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
         <div>
           <Label htmlFor="arrivalTime">Arrival Time</Label>
           <Input
             id="arrivalTime"
             type="datetime-local"
             value={formData.arrivalTime}
             onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
             placeholder="Select arrival time"
           />
         </div>
         <div>
           <Label htmlFor="departureTime">Departure Time</Label>
           <Input
             id="departureTime"
             type="datetime-local"
             value={formData.departureTime}
             onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
             placeholder="Select departure time"
           />
         </div>
       </div>
       
       <div>
         <Label htmlFor="accompanyingPersons">Number of Accompanying Persons</Label>
         <Select value={formData.accompanyingPersons.toString()} onValueChange={(value) => setFormData({ ...formData, accompanyingPersons: parseInt(value) })}>
           <SelectTrigger>
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="0">0</SelectItem>
             <SelectItem value="1">1</SelectItem>
             <SelectItem value="2">2</SelectItem>
             <SelectItem value="3">3</SelectItem>
             <SelectItem value="4">4</SelectItem>
             <SelectItem value="5">5+</SelectItem>
           </SelectContent>
         </Select>
       </div>
       
       <Button type="submit" disabled={isLoading} className="w-full">
         {isLoading ? "Registering..." : "Register Visitor"}
       </Button>
    </form>
  );
}
