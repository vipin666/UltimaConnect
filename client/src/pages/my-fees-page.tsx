import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Receipt,
  CreditCard,
  Clock,
  TrendingDown
} from "lucide-react";
import { format } from "date-fns";

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
  feeType: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
  feeSchedule?: {
    id: string;
    name: string;
    frequency: string;
  };
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
    feeType: {
      id: string;
      name: string;
      type: string;
    };
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      unitNumber?: string;
    };
  };
};

export default function MyFeesPage() {
  const { user } = useAuth();

  // Fee Transactions Query
  const { data: feeTransactions = [], isLoading: transactionsLoading } = useQuery<FeeTransaction[]>({
    queryKey: ['/api/fee-transactions'],
  });

  // Payments Query
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/payments'],
  });

  // Calculate summary data
  const summary = {
    totalPending: feeTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.remainingAmount), 0),
    totalOverdue: feeTransactions
      .filter(t => t.status === 'overdue')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
    totalPaid: feeTransactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + parseFloat(t.totalAmount), 0),
    pendingCount: feeTransactions.filter(t => t.status === 'pending').length,
    overdueCount: feeTransactions.filter(t => t.status === 'overdue').length,
    paidCount: feeTransactions.filter(t => t.status === 'paid').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodMap: { [key: string]: { label: string; icon: any } } = {
      cash: { label: 'Cash', icon: DollarSign },
      bank_transfer: { label: 'Bank Transfer', icon: CreditCard },
      upi: { label: 'UPI', icon: CreditCard },
      cheque: { label: 'Cheque', icon: Receipt },
      card: { label: 'Card', icon: CreditCard },
      online: { label: 'Online', icon: CreditCard },
    };

    const methodInfo = methodMap[method] || { label: method, icon: CreditCard };
    const Icon = methodInfo.icon;

    return (
      <Badge variant="outline" className="flex items-center">
        <Icon className="h-3 w-3 mr-1" />
        {methodInfo.label}
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to view your fees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Fees</h1>
          <p className="text-gray-600">View and track your society fees and payments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Unit: <span className="font-medium">{user.unitNumber || 'N/A'}</span></p>
          <p className="text-sm text-gray-500">Name: <span className="font-medium">{user.firstName} {user.lastName}</span></p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <div className="text-2xl font-bold text-yellow-600">
                  ₹{summary.totalPending.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">{summary.pendingCount} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <div className="text-2xl font-bold text-red-600">
                  ₹{summary.totalOverdue.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">{summary.overdueCount} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <div className="text-2xl font-bold text-green-600">
                  ₹{summary.totalPaid.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">{summary.paidCount} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{(summary.totalPending + summary.totalOverdue).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Fees */}
      {(summary.pendingCount > 0 || summary.overdueCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Outstanding Fees
            </CardTitle>
            <CardDescription>Fees that require your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTransactions
                    .filter(t => t.status === 'pending' || t.status === 'overdue')
                    .map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        className={transaction.status === 'overdue' ? 'bg-red-50' : ''}
                      >
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.feeType.name}</Badge>
                        </TableCell>
                        <TableCell>₹{parseFloat(transaction.totalAmount).toLocaleString()}</TableCell>
                        <TableCell className="text-green-600">₹{parseFloat(transaction.totalPaid).toLocaleString()}</TableCell>
                        <TableCell className="text-red-600 font-medium">₹{parseFloat(transaction.remainingAmount).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className={transaction.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                          {format(new Date(transaction.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            data-testid={`button-pay-${transaction.id}`}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Fee Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>All Fee Transactions</CardTitle>
          <CardDescription>Complete history of your society fees</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feeTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.feeType.name}</Badge>
                    </TableCell>
                    <TableCell>₹{parseFloat(transaction.totalAmount).toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">₹{parseFloat(transaction.totalPaid).toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">₹{parseFloat(transaction.remainingAmount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{format(new Date(transaction.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Record of all your payments</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.feeTransaction.description}</TableCell>
                    <TableCell className="text-green-600 font-medium">₹{parseFloat(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                    <TableCell className="font-mono text-sm">{payment.referenceNumber || '-'}</TableCell>
                    <TableCell>{format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-sm text-gray-600">{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>How to make payments for your society fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Online Payment Options</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• UPI: Contact admin for UPI ID</li>
                <li>• Bank Transfer: Get account details from office</li>
                <li>• Credit/Debit Card: Available through admin</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Offline Payment Options</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Cash: Pay at society office</li>
                <li>• Cheque: Payable to "Ultima Skymax Connect"</li>
                <li>• Office Hours: 9:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Important Notes</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• Always mention your unit number when making payments</li>
              <li>• Keep payment receipts for your records</li>
              <li>• Late payments may incur penalty charges</li>
              <li>• Contact the admin office for any payment issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}