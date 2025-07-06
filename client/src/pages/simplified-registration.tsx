import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Check, Users, Calendar, Zap } from "lucide-react";

// Simplified registration schema with seat allocation
const registrationSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  ownerFirstName: z.string().min(2, "First name must be at least 2 characters"),
  ownerLastName: z.string().min(2, "Last name must be at least 2 characters"),
  ownerEmail: z.string().email("Please enter a valid email address"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(20, "Subdomain must be less than 20 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  seatsNeeded: z.number().min(1, "Must have at least 1 seat").max(500, "Maximum 500 seats"),
  wantsTrial: z.boolean().default(true),
});
type RegistrationForm = z.infer<typeof registrationSchema>;
export default function SimplifiedRegistration() {
  const [step, setStep] = useState(1);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      businessName: "",
      ownerFirstName: "",
      ownerLastName: "",
      ownerEmail: "",
      subdomain: "",
      seatsNeeded: 5,
      wantsTrial: true,
    },
  });
  const checkSubdomain = async (subdomain: string) => {
    if (subdomain.length < 3) return;
    
    setIsCheckingSubdomain(true);
    try {
      const response = await apiRequest("POST", "/api/check-subdomain", { subdomain });
      const data = await response.json();
      setSubdomainAvailable(data.available);
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };
  const onSubmit = async (data: RegistrationForm) => {
    if (subdomainAvailable !== true) {
      toast({
        title: "Subdomain Error",
        description: "Please choose an available subdomain",
        variant: "destructive",
      });
      return;
    setIsSubmitting(true);
      // Get the default campaign pricing
      const campaignResponse = await apiRequest("GET", "/api/campaigns/default");
      const campaign = await campaignResponse.json();
      
      const registrationData = {
        ...data,
        campaignId: campaign.id,
        trialDays: campaign.trialDays,
        pricePerSeat: campaign.pricePerSeat,
      };
      const response = await apiRequest("POST", "/api/register-business", registrationData);
      const result = await response.json();
        title: "Registration Successful!",
        description: `Welcome to ShiftFlo! Your business is set up with ${data.seatsNeeded} seats.`,
      // Redirect to business login/dashboard
      window.location.href = `https://${data.subdomain}.${window.location.hostname}/dashboard`;
      console.error("Registration error:", error);
        title: "Registration Failed",
        description: "There was an error creating your business. Please try again.",
      setIsSubmitting(false);
  const monthlyCost = form.watch("seatsNeeded") * 3; // £3 per seat
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Start Your Free Trial</h1>
          <p className="text-xl text-gray-600">Set up your shift management system in minutes</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Benefits sidebar */}
          <div className="md:col-span-1">
            <Card className="bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  What You Get
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">14-Day Free Trial</p>
                    <p className="text-sm text-gray-600">Full access, no payment required</p>
                  </div>
                </div>
                  <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                    <p className="font-medium">Flexible Seat Allocation</p>
                    <p className="text-sm text-gray-600">Scale up or down anytime</p>
                  <Calendar className="w-5 h-5 text-purple-500 mt-0.5" />
                    <p className="font-medium">Complete Shift Management</p>
                    <p className="text-sm text-gray-600">Scheduling, time tracking, and more</p>
              </CardContent>
            </Card>
          </div>
          {/* Registration form */}
          <div className="md:col-span-2">
            <Card className="bg-white shadow-xl">
                <CardTitle>Create Your Business Account</CardTitle>
                <CardDescription>
                  Fill in your details to get started with your free trial
                </CardDescription>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Business Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                      
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Acme Restaurant"
                                autoComplete="organization"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                        name="subdomain"
                            <FormLabel>Choose Your Business URL</FormLabel>
                              <div className="flex">
                                <Input
                                  {...field}
                                  placeholder="your-business"
                                  autoComplete="off"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    setSubdomainAvailable(null);
                                    checkSubdomain(e.target.value);
                                  }}
                                />
                                <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-600">
                                  .shiftflo.app
                                </span>
                              </div>
                            {isCheckingSubdomain && (
                              <p className="text-sm text-gray-500">Checking availability...</p>
                            )}
                            {subdomainAvailable === true && (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Available
                              </p>
                            {subdomainAvailable === false && (
                              <p className="text-sm text-red-600">Not available - please try another</p>
                    </div>
                    {/* Owner Information */}
                      <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ownerFirstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="John"
                                  autoComplete="given-name"
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                          name="ownerLastName"
                              <FormLabel>Last Name</FormLabel>
                                  placeholder="Smith"
                                  autoComplete="family-name"
                      </div>
                        name="ownerEmail"
                            <FormLabel>Email Address</FormLabel>
                                type="email"
                                placeholder="john@acmerestaurant.com"
                                autoComplete="email"
                    {/* Seat Allocation */}
                      <h3 className="text-lg font-semibold text-gray-900">Seat Allocation</h3>
                        name="seatsNeeded"
                            <FormLabel>How many staff will you manage?</FormLabel>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                max="500"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            <div className="text-sm text-gray-600">
                              <p>Each seat allows one staff member to use the system.</p>
                              <p>You can adjust this anytime after registration.</p>
                            </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Trial: <Badge variant="outline">14 days free</Badge></p>
                            <p className="text-sm text-gray-600">After trial: £{monthlyCost}/month</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">£{monthlyCost}</p>
                            <p className="text-sm text-gray-600">per month</p>
                        </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isSubmitting || subdomainAvailable !== true}
                    >
                      {isSubmitting ? "Creating Your Business..." : "Start Free Trial"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      No payment required for trial. Cancel anytime during the 14-day trial period.
                    </p>
                  </form>
                </Form>
      </div>
    </div>
  );
}
