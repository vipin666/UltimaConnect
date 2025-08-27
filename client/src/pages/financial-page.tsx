import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Banknote,
  Receipt,
  BarChart3,
  FileText,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

// Fee Type Form Schema
const feeTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['maintenance', 'parking', 'amenity', 'security', 'utilities', 'penalty', 'other']),
  description: z.string().optional(),
  defaultAmount: z.string().optional(),
});

// Fee Schedule Form Schema
const feeScheduleSchema = z.object({
  feeTypeId: z.string().min(1, "Fee type is required"),
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  frequency: z.enum(['monthly', 'quarterly', 'annually', 'one_time']),
  dueDay: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  applicableUnits: z.string().optional(),
});

// Payment Form Schema
const paymentSchema = z.object({
  feeTransactionId: z.string().min(1, "Transaction is required"),
  userId: z.string().min(1, "User is required"),
  amount: z.string().min(1, "Amount is required"),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'online']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type FeeType = {
  id: string;
  name: string;
  type: string;
  description?: string;
  defaultAmount?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FeeSchedule = {
  id: string;
  feeTypeId: string;
  name: string;
  amount: string;
  frequency: string;
  dueDay?: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  applicableUnits?: string[];
  createdAt: string;
  updatedAt: string;
};

type FeeTransaction = {
  id: string;
  userId: string;
  feeScheduleId?: string;
  feeTypeId: string;
  description: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  penaltyAmount: string;
  totalAmount: string;
  unitNumber?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    unitNumber?: string;
  };
  feeType: FeeType;
  feeSchedule?: FeeSchedule;
  payments: any[];
  totalPaid: string;
  remainingAmount: string;
};

type Payment = {
  id: string;
  feeTransactionId: string;
  userId: string;
  amount: string;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  feeTransaction: {
    id: string;
    description: string;
    amount: string;
    feeType: FeeType;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      unitNumber?: string;
    };
  };
};

type FinancialSummary = {
  totalPending: string;
  totalPaid: string;
  totalOverdue: string;
  monthlyCollection: string;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
};

export default function FinancialPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Check if user is admin
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access financial management.</p>
        </div>
      </div>
    );
  }

  // Financial Summary Query
  const { data: financialSummary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ['/api/financial/summary'],
  });

  // Fee Types Query
  const { data: feeTypes = [], isLoading: feeTypesLoading } = useQuery<FeeType[]>({
    queryKey: ['/api/fee-types'],
  });

  // Fee Schedules Query
  const { data: feeSchedules = [], isLoading: schedulesLoading } = useQuery<FeeSchedule[]>({
    queryKey: ['/api/fee-schedules'],
  });

  // Fee Transactions Query
  const { data: feeTransactions = [], isLoading: transactionsLoading } = useQuery<FeeTransaction[]>({
    queryKey: ['/api/fee-transactions'],
  });

  // Payments Query
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  // Fee Type Mutations
  const createFeeTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof feeTypeSchema>) => {
      const response = await apiRequest('POST', '/api/fee-types', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Fee type created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/fee-types'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create fee type", variant: "destructive" });
    },
  });

  // Fee Schedule Mutations
  const createFeeScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof feeScheduleSchema>) => {
      const response = await apiRequest('POST', '/api/fee-schedules', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Fee schedule created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/fee-schedules'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create fee schedule", variant: "destructive" });
    },
  });

  // Generate Monthly Fees Mutation
  const generateMonthlyFeesMutation = useMutation({
    mutationFn: async (data: { month: string; year: string }) => {
      const response = await apiRequest('POST', '/api/fee-transactions/generate-monthly', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Success", 
        description: data.message 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fee-transactions'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate monthly fees", variant: "destructive" });
    },
  });

  // Payment Mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      const response = await apiRequest('POST', '/api/payments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payment recorded successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/fee-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/summary'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to record payment", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
            <p className="text-gray-600">Manage society fees, payments, and financial reports</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="fee-types" data-testid="tab-fee-types">Fee Types</TabsTrigger>
          <TabsTrigger value="schedules" data-testid="tab-schedules">Schedules</TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Paid</p>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{parseFloat(financialSummary?.totalPaid || '0').toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">{financialSummary?.paidCount} transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <div className="text-2xl font-bold text-yellow-600">
                        ₹{parseFloat(financialSummary?.totalPending || '0').toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">{financialSummary?.pendingCount} transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <div className="text-2xl font-bold text-red-600">
                        ₹{parseFloat(financialSummary?.totalOverdue || '0').toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">{financialSummary?.overdueCount} transactions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{parseFloat(financialSummary?.monthlyCollection || '0').toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">Collection</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common financial management tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <GenerateMonthlyFeesDialog onGenerate={generateMonthlyFeesMutation.mutate} />
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("transactions")}
                  data-testid="button-view-transactions"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("payments")}
                  data-testid="button-record-payment"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fee-types" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fee Types</h2>
            <CreateFeeTypeDialog onSubmit={createFeeTypeMutation.mutate} />
          </div>

          <Card>
            <CardContent className="p-6">
              {feeTypesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Default Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.map((feeType) => (
                      <TableRow key={feeType.id}>
                        <TableCell className="font-medium">{feeType.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{feeType.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {feeType.defaultAmount ? `₹${parseFloat(feeType.defaultAmount).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={feeType.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {feeType.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(feeType.createdAt), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fee Schedules</h2>
            <CreateFeeScheduleDialog feeTypes={feeTypes} onSubmit={createFeeScheduleMutation.mutate} />
          </div>

          <Card>
            <CardContent className="p-6">
              {schedulesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>₹{parseFloat(schedule.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{schedule.frequency}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={schedule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(schedule.startDate), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Fee Transactions</h2>
          </div>

          <Card>
            <CardContent className="p-6">
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.unitNumber || '-'}</TableCell>
                        <TableCell>
                          {transaction.user.firstName} {transaction.user.lastName}
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>₹{parseFloat(transaction.totalAmount).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₹{parseFloat(transaction.totalPaid).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600">₹{parseFloat(transaction.remainingAmount).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>{format(new Date(transaction.dueDate), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Payments</h2>
            <RecordPaymentDialog 
              transactions={feeTransactions.filter(t => parseFloat(t.remainingAmount) > 0)} 
              onSubmit={createPaymentMutation.mutate} 
            />
          </div>

          <Card>
            <CardContent className="p-6">
              {paymentsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.feeTransaction.user.unitNumber || '-'}</TableCell>
                        <TableCell>
                          {payment.feeTransaction.user.firstName} {payment.feeTransaction.user.lastName}
                        </TableCell>
                        <TableCell>{payment.feeTransaction.description}</TableCell>
                        <TableCell className="text-green-600">₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell>{payment.referenceNumber || '-'}</TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Financial Reports</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Collection Report</CardTitle>
              <CardDescription>Coming soon - Detailed monthly collection analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Monthly collection reports will be available soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Dialog Components
function CreateFeeTypeDialog({ onSubmit }: { onSubmit: (data: z.infer<typeof feeTypeSchema>) => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof feeTypeSchema>>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: {
      name: "",
      type: "maintenance",
      description: "",
      defaultAmount: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof feeTypeSchema>) => {
    onSubmit(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-fee-type">
          <Plus className="h-4 w-4 mr-2" />
          Create Fee Type
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Fee Type</DialogTitle>
          <DialogDescription>Add a new type of fee for the society</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Monthly Maintenance" data-testid="input-fee-type-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-fee-type">
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="amenity">Amenity</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="penalty">Penalty</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Description of the fee" data-testid="input-fee-type-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0.00" data-testid="input-fee-type-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-fee-type">Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreateFeeScheduleDialog({ 
  feeTypes, 
  onSubmit 
}: { 
  feeTypes: FeeType[]; 
  onSubmit: (data: z.infer<typeof feeScheduleSchema>) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof feeScheduleSchema>>({
    resolver: zodResolver(feeScheduleSchema),
    defaultValues: {
      feeTypeId: "",
      name: "",
      amount: "",
      frequency: "monthly",
      dueDay: "1",
      startDate: "",
      endDate: "",
      applicableUnits: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof feeScheduleSchema>) => {
    const submitData = {
      ...data,
      applicableUnits: data.applicableUnits ? data.applicableUnits.split(',').map(s => s.trim()) : [],
    };
    onSubmit(submitData as any);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-fee-schedule">
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Fee Schedule</DialogTitle>
          <DialogDescription>Set up a recurring fee schedule</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-fee-schedule-type">
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schedule Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Monthly Maintenance 2024" data-testid="input-schedule-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0.00" data-testid="input-schedule-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-schedule-frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="one_time">One Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" data-testid="input-schedule-start-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicableUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applicable Units (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., 1*, 2A, 2B (comma separated)" 
                      data-testid="input-schedule-units"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-schedule">Create</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function GenerateMonthlyFeesDialog({ onGenerate }: { onGenerate: (data: { month: string; year: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const handleGenerate = () => {
    if (month && year) {
      onGenerate({ month, year });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-generate-monthly-fees">
          <Calendar className="h-4 w-4 mr-2" />
          Generate Monthly Fees
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Monthly Fees</DialogTitle>
          <DialogDescription>Generate fee transactions for all residents for a specific month</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Month</label>
            <Select onValueChange={setMonth}>
              <SelectTrigger data-testid="select-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01">January</SelectItem>
                <SelectItem value="02">February</SelectItem>
                <SelectItem value="03">March</SelectItem>
                <SelectItem value="04">April</SelectItem>
                <SelectItem value="05">May</SelectItem>
                <SelectItem value="06">June</SelectItem>
                <SelectItem value="07">July</SelectItem>
                <SelectItem value="08">August</SelectItem>
                <SelectItem value="09">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Year</label>
            <Input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              data-testid="input-year"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!month || !year}
              data-testid="button-submit-generate"
            >
              Generate Fees
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({ 
  transactions, 
  onSubmit 
}: { 
  transactions: FeeTransaction[]; 
  onSubmit: (data: z.infer<typeof paymentSchema>) => void;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      feeTransactionId: "",
      userId: "",
      amount: "",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    },
  });

  const selectedTransaction = form.watch("feeTransactionId");
  const transaction = transactions.find(t => t.id === selectedTransaction);

  const handleSubmit = (data: z.infer<typeof paymentSchema>) => {
    onSubmit(data);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-record-payment-dialog">
          <Banknote className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record a payment for a fee transaction</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="feeTransactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      const selectedTxn = transactions.find(t => t.id === value);
                      if (selectedTxn) {
                        form.setValue("userId", selectedTxn.userId);
                        form.setValue("amount", selectedTxn.remainingAmount);
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-transaction">
                        <SelectValue placeholder="Select transaction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactions.map((txn) => (
                        <SelectItem key={txn.id} value={txn.id}>
                          {txn.unitNumber} - {txn.description} (₹{parseFloat(txn.remainingAmount).toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {transaction && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Resident:</strong> {transaction.user.firstName} {transaction.user.lastName}</p>
                <p className="text-sm"><strong>Total Amount:</strong> ₹{parseFloat(transaction.totalAmount).toLocaleString()}</p>
                <p className="text-sm"><strong>Remaining:</strong> ₹{parseFloat(transaction.remainingAmount).toLocaleString()}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="0.00" data-testid="input-payment-amount" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Transaction ID / Cheque number" data-testid="input-reference-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes" data-testid="input-payment-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-payment">Record Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}