import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Check, Building2, Users, Zap, X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Custom hook for real-time subdomain availability checking
function useSubdomainCheck(subdomain: string) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setStatus('idle');
      setMessage('');
      return;
    }

    setStatus('checking');
    setMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-subdomain/${subdomain}`);
        const data = await response.json();
        
        if (data.available) {
          setStatus('available');
          setMessage('Available!');
        } else {
          setStatus('taken');
          setMessage('Not Available');
        }
      } catch (error) {
        setStatus('idle');
        setMessage('Error checking availability');
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [subdomain]);

  return { status, message };
}

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
    phone: z.string()
      .min(1, "Phone number is required")
      .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, "Please enter a valid phone number"),
    website: z.string()
      .optional()
      .refine((val) => !val || val === "" || /^https?:\/\/.+\..+/.test(val), {
        message: "Please enter a valid website URL (e.g., https://example.com)"
      }),
    staffCount: z.number().min(1, "Please enter number of staff members"),
  }),
  // Owner Information
  owner: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
});

type RegistrationData = z.infer<typeof registrationSchema>;



export default function BusinessRegistration() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      business: {
        name: "",
        subdomain: "",
        businessType: "",
        phone: "",
        website: "",
        staffCount: 1,
      },
      owner: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
    },
  });

  // Watch subdomain field for real-time availability checking
  const subdomainValue = form.watch("business.subdomain");
  const subdomainCheck = useSubdomainCheck(subdomainValue);

  // Calculate pricing based on staff count
  const calculateMonthlyPrice = (staffCount: number) => {
    const pricePerSeat = 3.00; // £3.00 per seat per month
    return staffCount * pricePerSeat;
  };

  // Step validation function
  const validateStep = async (stepNumber: number) => {
    const values = form.getValues();
    
    if (stepNumber === 1) {
      // Validate business information
      const businessValidation = await form.trigger([
        "business.name", 
        "business.subdomain", 
        "business.businessType", 
        "business.phone", 
        "business.website", 
        "business.staffCount"
      ]);
      return businessValidation;
    } else if (stepNumber === 2) {
      // Validate owner information
      const ownerValidation = await form.trigger([
        "owner.firstName", 
        "owner.lastName", 
        "owner.email", 
        "owner.password", 
        "owner.confirmPassword"
      ]);
      return ownerValidation;
    }
    return true;
  };

  // Handle next step with validation
  const handleNextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid) {
      setStep(Math.min(3, step + 1));
    } else {
      toast({
        title: "Please fix the errors",
        description: "Complete all required fields before proceeding.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register-business", data);
      const result = await response.json();
      
      toast({
        title: "Registration Successful!",
        description: `Welcome to ShiftFlo! Check your email for activation instructions.`,
      });

      // Redirect to success page
      window.location.href = "/registration-success";
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Parse error message from apiRequest format: "400: {json}"
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message) {
        try {
          // Extract JSON from error message format "400: {json}"
          const match = error.message.match(/^\d+:\s*(.+)$/);
          if (match) {
            const errorData = JSON.parse(match[1]);
            errorMessage = errorData.message || errorMessage;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
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



  const getStepTitle = () => {
    switch (step) {
      case 1: return "Business Information";
      case 2: return "Owner Account";
      case 3: return "Subscription Summary";
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
                    {step === 3 && "Review your subscription details"}
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
                              <Input 
                                autoComplete="organization"
                                placeholder="Acme Restaurant" 
                                {...field} 
                              />
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
                                <Input 
                                  autoComplete="off"
                                  placeholder="acme-restaurant" 
                                  {...field} 
                                />
                                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-l-0 rounded-r-md">
                                  .shiftflo.com
                                </span>
                              </div>
                            </FormControl>
                            {/* Real-time availability feedback */}
                            {subdomainValue && subdomainValue.length >= 3 && (
                              <div className="flex items-center gap-2 mt-2">
                                {subdomainCheck.status === 'checking' && (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                    <span className="text-sm text-blue-600">{subdomainCheck.message}</span>
                                  </>
                                )}
                                {subdomainCheck.status === 'available' && (
                                  <>
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-600 font-medium">{subdomainCheck.message}</span>
                                  </>
                                )}
                                {subdomainCheck.status === 'taken' && (
                                  <>
                                    <X className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-600 font-medium">{subdomainCheck.message}</span>
                                  </>
                                )}
                              </div>
                            )}
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
                        name="business.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel" 
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="+44 20 1234 5678" 
                                {...field} 
                              />
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
                              <Input 
                                type="url" 
                                inputMode="url"
                                autoComplete="url"
                                list="website-domains"
                                placeholder="https://acmerestaurant.com" 
                                {...field} 
                              />
                            </FormControl>
                            <datalist id="website-domains">
                              <option value="https://www." />
                              <option value="https://" />
                              <option value=".com" />
                              <option value=".co.uk" />
                              <option value=".org" />
                            </datalist>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business.staffCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Staff Members *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="1000"
                                placeholder="5" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-gray-500">
                              How many staff members will you be scheduling? £3.00 per staff member per month.
                            </p>
                          </FormItem>
                        )}
                      />
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
                              <Input 
                                autoComplete="given-name"
                                placeholder="John" 
                                {...field} 
                              />
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
                              <Input 
                                autoComplete="family-name"
                                placeholder="Smith" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="owner.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  inputMode="email"
                                  autoComplete="email"
                                  list="email-domains"
                                  placeholder="john@acmerestaurant.com" 
                                  {...field} 
                                />
                              </FormControl>
                              <datalist id="email-domains">
                                <option value="@gmail.com" />
                                <option value="@yahoo.com" />
                                <option value="@outlook.com" />
                                <option value="@hotmail.com" />
                                <option value="@icloud.com" />
                              </datalist>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="owner.password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password *</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                autoComplete="new-password"
                                placeholder="••••••••" 
                                {...field} 
                              />
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
                              <Input 
                                type="password" 
                                autoComplete="new-password"
                                placeholder="••••••••" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Step 3: Pricing Summary */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Subscription Summary</h3>
                        <p className="text-gray-600 mb-6">Review your pricing details below</p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Users className="h-6 w-6 text-blue-600 mr-3" />
                            <div>
                              <h4 className="font-semibold text-gray-900">Staff Members</h4>
                              <p className="text-sm text-gray-600">Number of users you'll be scheduling</p>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {form.watch("business.staffCount") || 1}
                          </div>
                        </div>

                        <div className="border-t border-blue-200 pt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600">Price per staff member</span>
                            <span className="font-medium">£3.00/month</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Staff members</span>
                            <span className="font-medium">× {form.watch("business.staffCount") || 1}</span>
                          </div>
                          <div className="flex justify-between items-center text-lg font-bold border-t border-blue-200 pt-2">
                            <span>Monthly Total</span>
                            <span className="text-blue-600">
                              £{calculateMonthlyPrice(form.watch("business.staffCount") || 1).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">What's Included:</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Complete shift scheduling system
                          </li>
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Staff time tracking and management
                          </li>
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Holiday and swap request management
                          </li>
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Live operations dashboard
                          </li>
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Mobile-friendly interface
                          </li>
                          <li className="flex items-center text-sm">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            Email support and onboarding
                          </li>
                        </ul>
                      </div>

                      <div className="text-center text-sm text-gray-500">
                        <p>Your first 30 days are free! No setup fees or hidden costs.</p>
                      </div>
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
                        onClick={handleNextStep}
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