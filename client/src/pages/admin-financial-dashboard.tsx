import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, DollarSign, Users, Bell, Calendar, CreditCard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Defaulter = {
  id: string;
  userId: string;
  unitNumber: string;
  totalOutstandingAmount: string;
  oldestDueDate: string;
  daysInDefault: number;
  isActive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    unitNumber: string;
  };
  outstandingTransactions: Array<{
    id: string;
    description: string;
    totalAmount: string;
    dueDate: string;
    status: string;
  }>;
};

type Notification = {
  id: string;
  userId: string;
  feeTransactionId: string;
  notificationType: string;
  daysOverdue: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    unitNumber: string;
  };
};

type Transaction = {
  id: string;
  userId: string;
  description: string;
  totalAmount: string;
  dueDate: string;
  status: string;
  unitNumber: string;
};

export default function AdminFinancialDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    notes: ''
  });

  // Check admin authorization
  if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  // Fetch defaulters data
  const { data: defaulters = [], isLoading: defaultersLoading } = useQuery<Defaulter[]>({
    queryKey: ["/api/defaulters"],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch unread notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch pending transactions for payment processing
  const { data: pendingTransactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/financial/transactions"],
    select: (data: Transaction[]) => data.filter(t => t.status === 'pending' || t.status === 'overdue'),
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Process overdue payments mutation
  const processOverdueMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/process-overdue"),
    onSuccess: (response) => {
      const data = response.json();
      toast({
        title: "Overdue Processing Complete",
        description: `Generated ${data.notificationsGenerated || 0} notifications for defaulters`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/defaulters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark payment received mutation
  const markPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payments/mark-received", data),
    onSuccess: () => {
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded in the system",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/defaulters"] });
      setSelectedTransaction(null);
      setPaymentForm({ amount: '', paymentMethod: 'bank_transfer', referenceNumber: '', notes: '' });
    },
    onError: (error) => {
      toast({
        title: "Payment Recording Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProcessOverdue = () => {
    processOverdueMutation.mutate();
  };

  const handleMarkPayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setPaymentForm(prev => ({ ...prev, amount: transaction.totalAmount }));
  };

  const handleSubmitPayment = () => {
    if (!selectedTransaction) return;
    
    markPaymentMutation.mutate({
      transactionId: selectedTransaction.id,
      ...paymentForm
    });
  };

  const getDaysOverdueBadge = (days: number) => {
    if (days >= 30) return <Badge variant="destructive">Critical ({days} days)</Badge>;
    if (days >= 15) return <Badge variant="secondary">Overdue ({days} days)</Badge>;
    return <Badge variant="outline">Recent ({days} days)</Badge>;
  };

  if (authLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-financial-dashboard">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Management Dashboard</h1>
        <Button 
          onClick={handleProcessOverdue}
          disabled={processOverdueMutation.isPending}
          data-testid="button-process-overdue"
        >
          {processOverdueMutation.isPending ? "Processing..." : "Process Overdue Payments"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Defaulters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-defaulters">
              {defaultersLoading ? "..." : defaulters.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unread-notifications">
              {notificationsLoading ? "..." : notifications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payments">
              {transactionsLoading ? "..." : pendingTransactions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-outstanding-amount">
              ₹{defaulters.reduce((sum, d) => sum + parseFloat(d.totalOutstandingAmount), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="defaulters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="defaulters">Defaulters</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payment Management</TabsTrigger>
        </TabsList>

        <TabsContent value="defaulters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Defaulters</CardTitle>
              <CardDescription>
                Residents with overdue payments requiring immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {defaultersLoading ? (
                  <div>Loading defaulters...</div>
                ) : defaulters.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No active defaulters found</p>
                  </div>
                ) : (
                  defaulters.map((defaulter) => (
                    <div key={defaulter.id} className="border rounded-lg p-4" data-testid={`defaulter-${defaulter.userId}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {defaulter.user?.firstName} {defaulter.user?.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">Unit: {defaulter.unitNumber}</p>
                          <p className="text-sm">Outstanding: ₹{parseFloat(defaulter.totalOutstandingAmount).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          {getDaysOverdueBadge(defaulter.daysInDefault)}
                          <p className="text-xs text-muted-foreground mt-1">
                            Since: {new Date(defaulter.oldestDueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {defaulter.outstandingTransactions && defaulter.outstandingTransactions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Outstanding Transactions:</p>
                          <div className="space-y-1">
                            {defaulter.outstandingTransactions.map((transaction) => (
                              <div key={transaction.id} className="text-xs bg-gray-50 p-2 rounded">
                                {transaction.description} - ₹{parseFloat(transaction.totalAmount).toLocaleString()} 
                                (Due: {new Date(transaction.dueDate).toLocaleDateString()})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                System-generated notifications for overdue payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationsLoading ? (
                  <div>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No unread notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4" data-testid={`notification-${notification.id}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={notification.notificationType === 'final_notice' ? 'destructive' : 'secondary'}>
                              {notification.notificationType.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {notification.user?.firstName} {notification.user?.lastName} - Unit {notification.user?.unitNumber}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{notification.message}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
                <CardDescription>
                  Click on a transaction to record payment received from various sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactionsLoading ? (
                    <div>Loading transactions...</div>
                  ) : pendingTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending transactions</p>
                    </div>
                  ) : (
                    pendingTransactions.slice(0, 10).map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedTransaction?.id === transaction.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleMarkPayment(transaction)}
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">Unit: {transaction.unitNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{parseFloat(transaction.totalAmount).toLocaleString()}</p>
                            <Badge variant={transaction.status === 'overdue' ? 'destructive' : 'secondary'}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
                <CardDescription>
                  Mark payment as received from bank transfer, cash, cheque, or other sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTransaction ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedTransaction.description}</p>
                      <p className="text-sm text-muted-foreground">Unit: {selectedTransaction.unitNumber}</p>
                      <p className="text-sm">Due Amount: ₹{parseFloat(selectedTransaction.totalAmount).toLocaleString()}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="amount">Amount Received</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="Enter amount"
                          data-testid="input-payment-amount"
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select 
                          value={paymentForm.paymentMethod} 
                          onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}
                        >
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="net_banking">Net Banking</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
                        <Input
                          id="referenceNumber"
                          value={paymentForm.referenceNumber}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                          placeholder="Transaction ID, Cheque number, etc."
                          data-testid="input-reference-number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes about the payment"
                          rows={3}
                          data-testid="textarea-payment-notes"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSubmitPayment}
                          disabled={markPaymentMutation.isPending || !paymentForm.amount}
                          className="flex-1"
                          data-testid="button-record-payment"
                        >
                          {markPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedTransaction(null)}
                          data-testid="button-cancel-payment"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a transaction to record payment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}