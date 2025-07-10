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
import { Building2, Users, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";



// Registration form schema
const registrationSchema = z.object({
  // Business Information
  business: z.object({
    name: z.string().min(2, "Business name must be at least 2 characters"),
    staffCount: z.number().min(1, "Please enter number of staff members"),
  }),
  // Owner Information
  owner: z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
  }),
});

type RegistrationData = z.infer<typeof registrationSchema>;



export default function BusinessRegistration() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      business: {
        name: "",
        staffCount: 1,
      },
      owner: {
        firstName: "",
        lastName: "",
        email: "",
      },
    },
  });

  // Calculate pricing based on staff count
  const calculateMonthlyPrice = (staffCount: number) => {
    const pricePerSeat = 3.00; // £3.00 per seat per month
    return staffCount * pricePerSeat;
  };

  const onSubmit = async (data: RegistrationData) => {
    setIsLoading(true);
    try {
      // Transform nested form data to flat structure expected by server
      // Generate unique subdomain from business name with timestamp
      const baseSubdomain = data.business.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 15); // Shorter to leave room for timestamp
      
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits for uniqueness
      const autoSubdomain = `${baseSubdomain}-${timestamp}`;
      
      const flatData = {
        businessName: data.business.name,
        ownerFirstName: data.owner.firstName,
        ownerLastName: data.owner.lastName,
        ownerEmail: data.owner.email,
        subdomain: autoSubdomain,
        businessType: "Other", // Default placeholder
        phone: "", // Empty placeholder
        website: "", // Empty placeholder
        staffCount: data.business.staffCount,
      };
      
      const response = await apiRequest("POST", "/api/register-business", flatData);
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





  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Create Your ShiftFlo Account</CardTitle>
                  <CardDescription>
                    Tell us about your business and create your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Business and Owner Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
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

                    {/* Number of Staff */}
                    <FormField
                      control={form.control}
                      name="business.staffCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Staff Members *</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {/* Mobile-friendly staff counter */}
                              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-10 h-10 p-0 text-lg font-bold"
                                  onClick={() => {
                                    const newValue = Math.max(1, field.value - 1);
                                    field.onChange(newValue);
                                  }}
                                  disabled={field.value <= 1}
                                >
                                  -
                                </Button>
                                
                                <div className="flex-1 text-center">
                                  <div className="text-3xl font-bold text-blue-600">{field.value}</div>
                                  <div className="text-sm text-gray-600">
                                    {field.value === 1 ? 'staff member' : 'staff members'}
                                  </div>
                                </div>
                                
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-10 h-10 p-0 text-lg font-bold"
                                  onClick={() => {
                                    const newValue = Math.min(1000, field.value + 1);
                                    field.onChange(newValue);
                                  }}
                                  disabled={field.value >= 1000}
                                >
                                  +
                                </Button>
                              </div>
                              
                              {/* Quick select buttons for common sizes */}
                              <div className="flex flex-wrap gap-2 justify-center">
                                {[5, 10, 15, 25, 50].map((size) => (
                                  <Button
                                    key={size}
                                    type="button"
                                    variant={field.value === size ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => field.onChange(size)}
                                  >
                                    {size}
                                  </Button>
                                ))}
                              </div>
                              
                              {/* Manual input for exact numbers */}
                              <div className="flex flex-col sm:flex-row items-center gap-2">
                                <span className="text-sm text-gray-600">Or enter exact number:</span>
                                <Input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  value={field.value}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  className="w-20 text-center"
                                  placeholder="1-1000"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-gray-500">
                            How many staff members will you be scheduling? £3.00 per staff member per month.
                          </p>
                        </FormItem>
                      )}
                    />

                    {/* Owner First Name */}
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

                    {/* Owner Last Name */}
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

                    {/* Owner Email */}
                    <FormField
                      control={form.control}
                      name="owner.email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              inputMode="email"
                              autoComplete="email"
                              placeholder="john.smith@example.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Users className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Subscription Details</h4>
                          <p className="text-sm text-gray-600">£3.00 per staff member per month</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        £{calculateMonthlyPrice(form.watch("business.staffCount") || 1).toFixed(2)}/month
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-500">
                      <p>Your first 30 days are free! No setup fees or hidden costs.</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <div className="flex justify-center">
                    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                      {isLoading ? (
                        <>
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create ShiftFlo Account"
                      )}
                    </Button>
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