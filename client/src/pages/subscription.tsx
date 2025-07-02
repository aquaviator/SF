import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Column } from "@/components/DataTable";
import { ModalForm } from "@/components/ModalForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Download, 
  Star, 
  CheckCircle,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Billing Form Schema
const billingFormSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be 16 digits").max(19, "Invalid card number"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date (MM/YY)"),
  cvv: z.string().min(3, "CVV must be 3 digits").max(4, "CVV must be 3-4 digits"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
  billingAddress: z.string().min(1, "Billing address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

type BillingFormData = z.infer<typeof billingFormSchema>;

interface Subscription {
  id: number;
  planName: string;
  planType: "starter" | "professional" | "enterprise";
  status: "active" | "trial" | "expired" | "cancelled";
  startDate: Date;
  endDate: Date;
  trialDaysRemaining?: number;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  usageMetrics: {
    staffLimit: number;
    staffUsed: number;
    shiftsLimit: number;
    shiftsUsed: number;
    storageLimit: string;
    storageUsed: string;
  };
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: Date;
  amount: number;
  status: "paid" | "pending" | "overdue" | "failed";
  downloadUrl?: string;
  description: string;
}

interface Plan {
  id: string;
  name: string;
  type: "starter" | "professional" | "enterprise";
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    staff: number;
    shifts: number;
    storage: string;
  };
  popular?: boolean;
}

export default function Subscription() {
  const { tenantId } = useAuth();
  const { toast } = useToast();
  const [isBillingModalOpen, setIsBillingModalOpen] = React.useState(false);

  // Billing Form
  const billingForm = useForm<BillingFormData>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
      billingAddress: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  // Fetch Current Subscription from database
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/subscription?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Usage Metrics
  const { data: usageMetrics } = useQuery({
    queryKey: ["/api/usage-metrics", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/usage-metrics?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage metrics');
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Available Plans from database
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Fetch Invoices
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/subscription/invoices", tenantId],
    queryFn: async () => {
      // Mock data for now
      return [
        {
          id: 1,
          invoiceNumber: "INV-2024-001",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
          amount: 49,
          status: "paid",
          downloadUrl: "/invoices/inv-2024-001.pdf",
          description: "Professional Plan - Monthly",
        },
        {
          id: 2,
          invoiceNumber: "INV-2024-002",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
          amount: 49,
          status: "paid",
          downloadUrl: "/invoices/inv-2024-002.pdf",
          description: "Professional Plan - Monthly",
        },
        {
          id: 3,
          invoiceNumber: "INV-2024-003",
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          amount: 49,
          status: "pending",
          description: "Professional Plan - Monthly",
        },
      ];
    },
  });

  // Billing Mutation
  const billingMutation = useMutation({
    mutationFn: async (data: BillingFormData) => {
      return await apiRequest("POST", `/api/subscription/billing`, { ...data, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription", tenantId] });
      setIsBillingModalOpen(false);
      billingForm.reset();
      toast({ title: "Billing information updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update billing information", description: error.message, variant: "destructive" });
    },
  });

  // Plan Change Mutation
  const planChangeMutation = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", `/api/subscription/change-plan`, { planId, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription", tenantId] });
      toast({ title: "Plan changed successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to change plan", description: error.message, variant: "destructive" });
    },
  });

  // Trial Extension Mutation
  const trialExtensionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/subscription/extend-trial`, { tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription", tenantId] });
      toast({ title: "Trial extended successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to extend trial", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitBilling = (data: BillingFormData) => {
    billingMutation.mutate(data);
  };

  const handlePlanChange = (planId: string) => {
    planChangeMutation.mutate(planId);
  };

  const handleExtendTrial = () => {
    trialExtensionMutation.mutate();
  };

  const getStatusBadge = (status: Subscription["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      trial: "bg-blue-100 text-blue-800",
      expired: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    const labels = {
      active: "Active",
      trial: "Trial",
      expired: "Expired",
      cancelled: "Cancelled",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: Invoice["status"]) => {
    const variants = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    };

    const labels = {
      paid: "Paid",
      pending: "Pending",
      overdue: "Overdue",
      failed: "Failed",
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice",
      cell: (invoice) => (
        <div>
          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
          <p className="text-xs text-gray-500">{invoice.description}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (invoice) => (
        <span className="text-sm">
          {invoice.date.toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (invoice) => (
        <span className="text-sm font-medium">
          ${invoice.amount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (invoice) => getInvoiceStatusBadge(invoice.status),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (invoice) => (
        <div className="flex gap-2">
          {invoice.downloadUrl && (
            <Button size="sm" variant="outline">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          )}
        </div>
      ),
    },
  ];

  const formatNumber = (num: number) => {
    if (num === -1) return "Unlimited";
    return num.toLocaleString();
  };

  if (subscriptionLoading) {
    return <div className="flex items-center justify-center h-64">Loading subscription...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription</h2>
          <p className="text-gray-600">Manage your plan, billing, and usage</p>
        </div>
        <Button onClick={() => setIsBillingModalOpen(true)}>
          <CreditCard className="w-4 h-4 mr-2" />
          Update Billing
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                {subscription && getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent>
              {subscription && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{subscription.planName}</h3>
                      <p className="text-sm text-gray-600">
                        ${subscription.monthlyPrice}/month • ${subscription.annualPrice}/year
                      </p>
                    </div>
                    <div className="text-right">
                      {subscription.status === "trial" && subscription.trialDaysRemaining && (
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            {subscription.trialDaysRemaining} days left in trial
                          </p>
                          <Button size="sm" variant="outline" onClick={handleExtendTrial} className="mt-2">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Extend Trial
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="space-y-1">
                        {subscription.features?.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            {feature}
                          </li>
                        )) || <li className="text-sm text-gray-500">No features listed</li>}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Usage</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Staff Members</span>
                            <span>{subscription.usageMetrics?.staffUsed || 0} / {formatNumber(subscription.usageMetrics?.staffLimit || 0)}</span>
                          </div>
                          <Progress 
                            value={!subscription.usageMetrics || subscription.usageMetrics.staffLimit === -1 ? 0 : (subscription.usageMetrics.staffUsed / subscription.usageMetrics.staffLimit) * 100} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Shifts This Month</span>
                            <span>{subscription.usageMetrics?.shiftsUsed || 0} / {formatNumber(subscription.usageMetrics?.shiftsLimit || 0)}</span>
                          </div>
                          <Progress 
                            value={!subscription.usageMetrics || subscription.usageMetrics.shiftsLimit === -1 ? 0 : (subscription.usageMetrics.shiftsUsed / subscription.usageMetrics.shiftsLimit) * 100} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Storage</span>
                            <span>{subscription.usageMetrics?.storageUsed || '0 MB'} / {subscription.usageMetrics?.storageLimit || '0 MB'}</span>
                          </div>
                          <Progress value={12.5} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {subscription?.planType === plan.type && (
                      <Badge variant="outline">Current</Badge>
                    )}
                  </CardTitle>
                  <div>
                    <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    or ${plan.annualPrice}/year (save ${(plan.monthlyPrice * 12) - plan.annualPrice})
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-sm mb-2">Limits</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>Staff: {formatNumber(plan.limits.staff)}</li>
                        <li>Shifts: {formatNumber(plan.limits.shifts)}</li>
                        <li>Storage: {plan.limits.storage}</li>
                      </ul>
                    </div>

                    <Button 
                      className="w-full" 
                      variant={subscription?.planType === plan.type ? "outline" : "default"}
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={subscription?.planType === plan.type || planChangeMutation.isPending}
                    >
                      {subscription?.planType === plan.type ? "Current Plan" : 
                       planChangeMutation.isPending ? "Changing..." : "Choose Plan"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <DataTable
            data={invoices}
            columns={invoiceColumns}
            title="Billing History"
            isLoading={false}
            emptyState={
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No invoices available</p>
                <p className="text-sm text-gray-400">Your billing history will appear here</p>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      <ModalForm
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        title="Update Billing Information"
        form={billingForm}
        onSubmit={onSubmitBilling}
        submitLabel="Update Billing"
        isLoading={billingMutation.isPending}
      >
        <div className="space-y-4">
          <FormField
            control={billingForm.control}
            name="cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Number</FormLabel>
                <FormControl>
                  <Input placeholder="1234 5678 9012 3456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={billingForm.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input placeholder="MM/YY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={billingForm.control}
              name="cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={billingForm.control}
            name="cardholderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cardholder Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={billingForm.control}
            name="billingAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billing Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={billingForm.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={billingForm.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={billingForm.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </ModalForm>
    </div>
  );
}