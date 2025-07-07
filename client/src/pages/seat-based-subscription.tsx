import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Minus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripeCheckout } from '@/components/StripeCheckout';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Billing Management Component
function BillingManagement({ tenantId }: { tenantId: string }) {
  const { toast } = useToast();
  const [showAddCard, setShowAddCard] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);

  // Fetch payment methods
  const { data: paymentMethods, refetch: refetchPaymentMethods } = useQuery({
    queryKey: ["/api/stripe/payment-methods"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/payment-methods");
      return response.json();
    },
  });

  // Fetch invoices
  const { data: invoices } = useQuery({
    queryKey: ["/api/stripe/invoices"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/invoices");
      return response.json();
    },
  });

  // Create setup intent for adding cards
  const createSetupIntent = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/setup-intent", { tenantId });
      return response.json();
    },
    onSuccess: (data) => {
      setSetupClientSecret(data.clientSecret);
      setShowAddCard(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to setup card addition",
        variant: "destructive",
      });
    },
  });

  // Delete payment method
  const deletePaymentMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await apiRequest("DELETE", `/api/stripe/payment-methods/${paymentMethodId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success", 
        description: "Payment method removed successfully",
      });
      refetchPaymentMethods();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive",
      });
    },
  });

  // Set default payment method
  const setDefaultPaymentMethod = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      await apiRequest("POST", `/api/stripe/payment-methods/${paymentMethodId}/default`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default payment method updated",
      });
      refetchPaymentMethods();
    },
    onError: (error: Error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update default payment method",
        variant: "destructive",
      });
    },
  });

  const handleSetupComplete = () => {
    setShowAddCard(false);
    setSetupClientSecret(null);
    refetchPaymentMethods();
    toast({
      title: "Success",
      description: "Payment method added successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Payment Methods
            <Button 
              onClick={() => createSetupIntent.mutate()}
              disabled={createSetupIntent.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method: any) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      💳
                    </div>
                    <div>
                      <p className="font-medium">
                        **** **** **** {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.brand.toUpperCase()} • Expires {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultPaymentMethod.mutate(method.id)}
                        disabled={setDefaultPaymentMethod.isPending}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePaymentMethod.mutate(method.id)}
                      disabled={deletePaymentMethod.isPending}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payment methods added yet</p>
              <p className="text-sm">Add a card to enable automatic billing</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      Invoice #{invoice.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created).toLocaleDateString()} • {invoice.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">
                        £{(invoice.amount / 100).toFixed(2)}
                      </p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.hostedInvoiceUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No billing history yet</p>
              <p className="text-sm">Invoices will appear here after your first payment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Card Modal */}
      {showAddCard && setupClientSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Add Payment Method</h3>
            <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret }}>
              <StripeSetupForm
                onSuccess={handleSetupComplete}
                onCancel={() => {
                  setShowAddCard(false);
                  setSetupClientSecret(null);
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}

// Stripe Setup Form Component for adding payment methods
function StripeSetupForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/owner/subscription?setup=success',
      },
      redirect: 'if_required'
    });

    setIsLoading(false);

    if (error) {
      console.error('Setup error:', error);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading} className="flex-1">
          {isLoading ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </form>
  );
}



// Seat Management Form Schema
const seatManagementSchema = z.object({
  seatsToAdd: z.number().min(1, "Must add at least 1 seat").max(50, "Cannot add more than 50 seats at once"),
});

type SeatManagementData = z.infer<typeof seatManagementSchema>;

interface SeatBasedSubscription {
  id: number;
  status: "active" | "trial" | "expired" | "cancelled";
  seatsIncluded: number;
  seatsUsed: number;
  pricePerSeat: number;
  monthlyTotal: number;
  trialDaysRemaining?: number;
  nextBillingDate: Date;
  features: string[];
}

interface SeatUsage {
  totalSeats: number;
  activeStaff: number;
  pendingInvites: number;
  availableSeats: number;
  utilizationPercentage: number;
}

export default function SeatBasedSubscription() {
  const { tenantId } = useRole();
  const { toast } = useToast();
  const [selectedSeats, setSelectedSeats] = React.useState(5);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [pendingSeats, setPendingSeats] = useState<number>(0);

  // Seat Management Form
  const seatForm = useForm<SeatManagementData>({
    resolver: zodResolver(seatManagementSchema),
    defaultValues: {
      seatsToAdd: 1,
    },
  });

  // Fetch Current Subscription
  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SeatBasedSubscription>({
    queryKey: ["/api/subscription", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/subscription?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Fetch Seat Usage
  const { data: seatUsage } = useQuery<SeatUsage>({
    queryKey: ["/api/seat-usage", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/seat-usage?tenantId=${tenantId}`);
      if (!response.ok) throw new Error('Failed to fetch seat usage');
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Create Payment Intent Mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: SeatManagementData) => {
      console.log(`💳 CREATING_PAYMENT_INTENT: seatsToAdd: ${data.seatsToAdd}, tenantId: ${tenantId}`);
      return apiRequest("POST", "/api/subscription/create-payment-intent", {
        seatsToAdd: data.seatsToAdd,
        tenantId
      });
    },
    onSuccess: (response: any) => {
      console.log(`✅ PAYMENT_INTENT_CREATED: full response:`, response);
      console.log(`✅ PAYMENT_INTENT_CREATED: clientSecret available, amount: £${(response.amount / 100).toFixed(2)}, seats: ${response.seatsToAdd}`);
      setClientSecret(response.clientSecret);
      setPaymentAmount(response.amount);
      setPendingSeats(response.seatsToAdd);
    },
    onError: (error: any) => {
      console.error(`❌ PAYMENT_INTENT_FAILED:`, error);
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add Seats Mutation (after successful payment)
  const addSeatsMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      console.log(`🏢 ADDING_SEATS_TO_SUBSCRIPTION: pendingSeats: ${pendingSeats}, paymentIntentId: ${paymentIntentId}`);
      return apiRequest("POST", "/api/subscription/add-seats", {
        seatsToAdd: pendingSeats,
        paymentIntentId
      });
    },
    onSuccess: (response: any) => {
      console.log(`🎉 SEATS_ADDED_SUCCESS:`, response);
      toast({
        title: "Seats Added Successfully",
        description: `Your team capacity has been increased. ${response.invoice ? 'Confirmation email sent!' : ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seat-usage"] });
      setClientSecret(null);
      setPaymentAmount(0);
      setPendingSeats(0);
      seatForm.reset();
    },
    onError: (error: any) => {
      console.error(`❌ ADD_SEATS_FAILED:`, error);
      toast({
        title: "Failed to Add Seats",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSeats = (data: SeatManagementData) => {
    console.log(`🚀 INITIATING_SEAT_UPGRADE: seats to add: ${data.seatsToAdd}, current seats: ${subscription?.seatsIncluded || 5}`);
    createPaymentMutation.mutate(data);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log(`✅ PAYMENT_SUCCESS: paymentIntentId: ${paymentIntentId}, proceeding to add seats`);
    addSeatsMutation.mutate(paymentIntentId);
  };

  const calculateNewTotal = (additionalSeats: number) => {
    const baseSeats = subscription?.seatsIncluded || 5;
    const pricePerSeat = subscription?.pricePerSeat || 3;
    return (baseSeats + additionalSeats) * pricePerSeat;
  };

  const getSeatStatusColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 70) return "text-yellow-600"; 
    return "text-green-600";
  };

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seat-Based Subscription</h1>
          <p className="text-muted-foreground">Scale your plan as your team grows</p>
        </div>
        <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
          {subscription?.status?.toUpperCase()}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seats">Seat Management</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seats Included</p>
                  <p className="text-2xl font-bold">{subscription?.seatsIncluded || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seats Used</p>
                  <p className="text-2xl font-bold">{seatUsage?.activeStaff || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Total</p>
                  <p className="text-2xl font-bold">£{subscription?.monthlyTotal || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Per Seat</p>
                  <p className="text-2xl font-bold">£{subscription?.pricePerSeat || 8}</p>
                </div>
              </div>
              
              {subscription?.trialDaysRemaining && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {subscription.trialDaysRemaining} days left in trial
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seat Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle>Seat Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Team Usage</span>
                  <span className={`font-bold ${getSeatStatusColor(seatUsage?.utilizationPercentage || 0)}`}>
                    {seatUsage?.utilizationPercentage || 0}%
                  </span>
                </div>
                <Progress value={seatUsage?.utilizationPercentage || 0} className="h-2" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Staff:</span>
                    <span>{seatUsage?.activeStaff || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Seats:</span>
                    <span>{seatUsage?.availableSeats || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Included Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscription?.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                )) || [
                  "Unlimited shift scheduling",
                  "Time tracking & reporting", 
                  "Staff mobile app access",
                  "Real-time notifications",
                  "Basic analytics & insights",
                  "Email support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seats" className="space-y-6">
          {/* Current Seat Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Seat Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{subscription?.seatsIncluded || 5}</div>
                  <div className="text-sm text-muted-foreground">Total Seats</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{seatUsage?.activeStaff || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Staff</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{seatUsage?.pendingInvites || 0}</div>
                  <div className="text-sm text-muted-foreground">Pending Invites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{seatUsage?.availableSeats || 0}</div>
                  <div className="text-sm text-muted-foreground">Available Seats</div>
                </div>
              </div>
              
              {/* Usage Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Seat Utilization</span>
                  <span className={getSeatStatusColor(seatUsage?.utilizationPercentage || 0)}>
                    {seatUsage?.utilizationPercentage || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      (seatUsage?.utilizationPercentage || 0) >= 90 ? 'bg-red-500' :
                      (seatUsage?.utilizationPercentage || 0) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(seatUsage?.utilizationPercentage || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seat Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Adjust Seat Count
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Upgrade or downgrade your subscription as your team grows or shrinks
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Plan Display */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Current Plan</div>
                      <div className="text-sm text-muted-foreground">
                        {subscription?.seatsIncluded || 5} seats • £{subscription?.pricePerSeat || 3}/seat/month
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">£{subscription?.monthlyTotal || 15}/month</div>
                    </div>
                  </div>
                </div>

                {/* Seat Selector */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Select New Seat Count</label>
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}
                        disabled={selectedSeats <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-2xl font-bold w-16 text-center">{selectedSeats}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSeats(selectedSeats + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Pricing Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-2">Monthly Billing</h3>
                      <div className="text-2xl font-bold">£{(selectedSeats * 3).toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground">£3 per seat/month</p>
                      
                      {selectedSeats !== (subscription?.seatsIncluded || 5) && (
                        <div className="mt-2 text-sm">
                          {selectedSeats > (subscription?.seatsIncluded || 5) ? (
                            <span className="text-green-600">
                              +£{((selectedSeats - (subscription?.seatsIncluded || 5)) * 3).toFixed(2)} increase
                            </span>
                          ) : (
                            <span className="text-blue-600">
                              -£{(((subscription?.seatsIncluded || 5) - selectedSeats) * 3).toFixed(2)} savings
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                      <h3 className="font-semibold mb-2">Annual Billing</h3>
                      <div className="text-2xl font-bold text-blue-600">
                        £{(selectedSeats * 3 * 12 * 0.85).toFixed(2)}
                      </div>
                      <p className="text-sm text-blue-600">£{(3 * 0.85).toFixed(2)} per seat/month (15% savings)</p>
                      
                      {selectedSeats !== (subscription?.seatsIncluded || 5) && (
                        <div className="mt-2 text-sm text-blue-600">
                          Annual savings: £{(selectedSeats * 3 * 12 * 0.15).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedSeats !== (subscription?.seatsIncluded || 5) && (
                    <div className="space-y-3">
                      {selectedSeats > (subscription?.seatsIncluded || 5) ? (
                        <Button 
                          onClick={() => {
                            const seatsToAdd = selectedSeats - (subscription?.seatsIncluded || 5);
                            seatForm.setValue("seatsToAdd", seatsToAdd);
                            handleAddSeats({ seatsToAdd });
                          }}
                          disabled={createPaymentMutation.isPending}
                          className="w-full"
                          size="lg"
                        >
                          {createPaymentMutation.isPending ? "Processing..." : `Upgrade to ${selectedSeats} Seats`}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement downgrade functionality
                            toast({
                              title: "Downgrade Request",
                              description: "Please contact support to downgrade your subscription.",
                            });
                          }}
                          className="w-full"
                          size="lg"
                        >
                          Request Downgrade to {selectedSeats} Seats
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedSeats(subscription?.seatsIncluded || 5)}
                        className="w-full"
                      >
                        Reset to Current Plan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Checkout Modal */}
          {clientSecret && (
            <Card className="border-2 border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700">Complete Your Payment</CardTitle>
                <p className="text-sm text-blue-600">
                  Adding {pendingSeats} seat{pendingSeats !== 1 ? 's' : ''} for £{(paymentAmount / 100).toFixed(2)}
                </p>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckout
                    seatsToAdd={pendingSeats}
                    totalAmount={paymentAmount}
                    onSuccess={handlePaymentSuccess}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}

          {/* Seat Recommendations */}
          {seatUsage && seatUsage.utilizationPercentage > 80 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Seat Usage Alert
                </CardTitle>
              </CardHeader>
              <CardContent className="text-yellow-700">
                <p>
                  You're using {seatUsage.utilizationPercentage}% of your seats. 
                  Consider adding more seats to avoid hitting your limit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>



        <TabsContent value="billing" className="space-y-6">
          <BillingManagement tenantId={tenantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}