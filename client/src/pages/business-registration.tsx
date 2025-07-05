import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, Building2, Users, Star, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Registration form schema
const registrationSchema = z.object({
  // Business Information
  business: z.object({
    name: z.string().min(2, "Business name must be at least 2 characters"),
    subdomain: z.string()
      .min(3, "Subdomain must be at least 3 characters")
      .max(20, "Subdomain must be less than 20 characters")
      .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
    businessType: z.string().min(1, "Please select a business type"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Please enter a valid email address").optional(),
    website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    description: z.string().optional(),
  }),
  // Owner Information
  owner: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
  // Plan selection
  planId: z.number().min(1, "Please select a pricing plan"),
});

type RegistrationData = z.infer<typeof registrationSchema>;

interface PricingPlan {
  id: number;
  tierName: string;
  minSeats: number;
  maxSeats: number | null;
  pricePerSeat: number;
  features: string[];
  isActive: boolean;
}

export default function BusinessRegistration() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      business: {
        name: "",
        subdomain: "",
        businessType: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        description: "",
      },
      owner: {
        firstName: "",
        lastName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
      },
      planId: 0,
    },
  });

  // Load pricing plans
  useState(() => {
    const loadPlans = async () => {
      try {
        const response = await apiRequest("GET", "/api/seat-pricing");
        const plansData = await response.json();
        setPlans(plansData);
      } catch (error) {
        console.error("Failed to load pricing plans:", error);
        toast({
          title: "Error",
          description: "Failed to load pricing plans. Please refresh and try again.",
          variant: "destructive",
        });
      }
    };
    loadPlans();
  });

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register-business", data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const result = await response.json();
      
      toast({
        title: "Registration Successful!",
        description: `Welcome to ShiftFlo, ${result.user.firstName}! Your business ${result.tenant.name} has been created.`,
      });

      // Redirect to dashboard or login page
      window.location.href = "/";
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypes = [
    "Restaurant & Food Service",
    "Retail & Commerce", 
    "Healthcare & Medical",
    "Hospitality & Tourism",
    "Security & Safety",
    "Logistics & Transportation",
    "Manufacturing & Production",
    "Education & Training",
    "Professional Services",
    "Other",
  ];

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Business Information";
      case 2: return "Owner Account";
      case 3: return "Choose Your Plan";
      default: return "Registration";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">ShiftFlo Business Registration</h1>
            </div>
            <p className="text-lg text-gray-600">
              Get your team organized with smart scheduling and workforce management
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= stepNumber 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`
                      w-12 h-1 mx-2
                      ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>{getStepTitle()}</CardTitle>
                  <CardDescription>
                    {step === 1 && "Tell us about your business"}
                    {step === 2 && "Create your admin account"}
                    {step === 3 && "Select the right plan for your team"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Step 1: Business Information */}
                  {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="business.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Acme Restaurant" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business.subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subdomain *</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Input placeholder="acme-restaurant" {...field} />
                                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-l-0 rounded-r-md">
                                  .shiftflo.com
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business.businessType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select business type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {businessTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
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
                        name="business.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Email</FormLabel>
                            <FormControl>
                              <Input placeholder="info@acmerestaurant.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+44 20 1234 5678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business.website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://acmerestaurant.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="business.address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Address</FormLabel>
                              <FormControl>
                                <Textarea placeholder="123 High Street, London, UK" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="business.description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Brief description of your business..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Owner Information */}
                  {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="owner.firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="owner.lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Smith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="owner.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="john@acmerestaurant.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="owner.username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <Input placeholder="johnsmith" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="owner.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="owner.confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password *</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Plan Selection */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={`
                              relative border-2 rounded-lg p-6 cursor-pointer transition-all
                              ${form.watch("planId") === plan.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            onClick={() => form.setValue("planId", plan.id)}
                          >
                            {plan.tierName === "Professional" && (
                              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                                <Star className="w-3 h-3 mr-1" />
                                Most Popular
                              </Badge>
                            )}
                            
                            <div className="text-center mb-4">
                              <h3 className="text-xl font-semibold text-gray-900">{plan.tierName}</h3>
                              <div className="mt-2">
                                <span className="text-3xl font-bold text-gray-900">
                                  {formatPrice(plan.pricePerSeat)}
                                </span>
                                <span className="text-gray-500">/seat/month</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {plan.minSeats}-{plan.maxSeats || "∞"} seats
                              </p>
                            </div>

                            <ul className="space-y-2 mb-4">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center text-sm">
                                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>

                            {form.watch("planId") === plan.id && (
                              <div className="absolute top-4 right-4">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <FormField
                        control={form.control}
                        name="planId"
                        render={() => (
                          <FormItem>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(Math.max(1, step - 1))}
                      disabled={step === 1}
                    >
                      Previous
                    </Button>

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={() => setStep(Math.min(3, step + 1))}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Complete Registration"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}