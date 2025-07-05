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
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { StripeCheckout } from '@/components/StripeCheckout';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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
  const { tenantId } = useAuth();
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
      return apiRequest("POST", "/api/subscription/create-payment-intent", {
        seatsToAdd: data.seatsToAdd,
        tenantId
      });
    },
    onSuccess: (response: any) => {
      setClientSecret(response.clientSecret);
      setPaymentAmount(response.amount);
      setPendingSeats(response.seatsToAdd);
    },
    onError: (error: any) => {
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
      return apiRequest("POST", "/api/subscription/add-seats", {
        seatsToAdd: pendingSeats,
        paymentIntentId
      });
    },
    onSuccess: () => {
      toast({
        title: "Seats Added Successfully",
        description: "Your team capacity has been increased.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/seat-usage"] });
      setClientSecret(null);
      setPaymentAmount(0);
      setPendingSeats(0);
      seatForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Seats",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddSeats = (data: SeatManagementData) => {
    createPaymentMutation.mutate(data);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seats">Seat Management</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Calculator</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
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
          {/* Add Seats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add More Seats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={seatForm.handleSubmit(handleAddSeats)} className="space-y-4">
                <FormField
                  control={seatForm.control}
                  name="seatsToAdd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Seats to Add</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(Math.max(1, field.value - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            {...field}
                            type="number"
                            className="w-20 text-center"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(Math.min(50, field.value + 1))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Additional Monthly Cost:</span>
                    <span className="font-bold">
                      £{((subscription?.pricePerSeat || 3) * seatForm.watch("seatsToAdd")).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span>New Monthly Total:</span>
                    <span className="font-bold text-lg">
                      £{calculateNewTotal(seatForm.watch("seatsToAdd")).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={createPaymentMutation.isPending || addSeatsMutation.isPending} 
                  className="w-full"
                >
                  {createPaymentMutation.isPending ? "Setting up payment..." : 
                   addSeatsMutation.isPending ? "Adding Seats..." : "Proceed to Payment"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Stripe Checkout */}
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCheckout
                seatsToAdd={pendingSeats}
                totalAmount={paymentAmount}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
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

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    How many seats do you need?
                  </label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold w-16 text-center">{selectedSeats}</span>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSeats(selectedSeats + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border rounded-lg">
                    <h3 className="font-semibold mb-2">Monthly Billing</h3>
                    <div className="text-3xl font-bold">£{(selectedSeats * 3).toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">£3 per seat/month</p>
                  </div>
                  
                  <div className="p-6 border rounded-lg bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-2">Annual Billing</h3>
                    <div className="text-3xl font-bold text-blue-600">
                      £{(selectedSeats * 3 * 12 * 0.85).toFixed(2)}
                    </div>
                    <p className="text-sm text-blue-600">£{(3 * 0.85).toFixed(2)} per seat/month (15% savings)</p>
                  </div>
                </div>

                <div className="text-center">
                  <Button size="lg">
                    Upgrade to {selectedSeats} Seats
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Billing history will appear here once you upgrade to a paid plan</p>
                <p className="text-sm">Connect with Stripe for automated billing management</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}