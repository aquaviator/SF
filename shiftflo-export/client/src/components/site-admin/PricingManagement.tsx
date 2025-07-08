import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  PoundSterling,
  Tag,
  TrendingUp,
  Calendar,
  Percent
} from "lucide-react";

// Schema definitions
const seatPricingSchema = z.object({
  pricePerSeat: z.number().min(1, "Price must be greater than 0"),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  isActive: z.boolean().default(true),
});

const promoCodeSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20, "Code must be less than 20 characters"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(1, "Discount value must be greater than 0"),
  validFrom: z.string(),
  validTo: z.string(),
  usageLimit: z.number().min(1).optional(),
  tenantRestrictions: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  trialDays: z.number().min(1).max(365).default(14),
  defaultSeats: z.number().min(1).max(1000).default(5),
  pricePerSeat: z.number().min(1).default(300),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

type SeatPricingFormData = z.infer<typeof seatPricingSchema>;
type PromoCodeFormData = z.infer<typeof promoCodeSchema>;
type CampaignFormData = z.infer<typeof campaignSchema>;

interface SeatPricing {
  id: number;
  pricePerSeat: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PromoCode {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  timesUsed: number;
  tenantRestrictions: string[] | null;
  isActive: boolean;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  trialDays: number;
  defaultSeats: number;
  pricePerSeat: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PricingManagementProps {
  onUpdate?: () => void;
}

export function PricingManagement({ onUpdate }: PricingManagementProps) {
  const [editingPricing, setEditingPricing] = useState<SeatPricing | null>(null);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch seat pricing
  const { data: seatPricing = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['/api/admin/pricing/seats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/pricing/seats');
      if (!response.ok) throw new Error('Failed to fetch seat pricing');
      return response.json();
    },
  });

  // Fetch promo codes
  const { data: promoCodes = [], isLoading: promoLoading } = useQuery({
    queryKey: ['/api/admin/pricing/promo-codes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/pricing/promo-codes');
      if (!response.ok) throw new Error('Failed to fetch promo codes');
      return response.json();
    },
  });

  // Fetch campaigns
  const { data: campaigns = [], isLoading: campaignLoading } = useQuery({
    queryKey: ['/api/admin/pricing/campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/admin/pricing/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    },
  });

  // Seat Pricing Form
  const pricingForm = useForm<SeatPricingFormData>({
    resolver: zodResolver(seatPricingSchema),
    defaultValues: {
      pricePerSeat: 300,
      features: ["Basic shift scheduling", "Staff management", "Time tracking", "Email support"],
      isActive: true,
    },
  });

  // Promo Code Form
  const promoForm = useForm<PromoCodeFormData>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      discountType: "percentage",
      isActive: true,
    },
  });

  // Campaign Form
  const campaignForm = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      trialDays: 14,
      defaultSeats: 5,
      pricePerSeat: 300,
      isActive: true,
    },
  });

  // Mutations
  const createPricingMutation = useMutation({
    mutationFn: async (data: SeatPricingFormData) => {
      const url = editingPricing 
        ? `/api/admin/pricing/seats/${editingPricing.id}`
        : '/api/admin/pricing/seats';
      const method = editingPricing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save seat pricing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing/seats'] });
      setShowPricingDialog(false);
      setEditingPricing(null);
      pricingForm.reset();
      toast({
        title: "Success",
        description: `Seat pricing ${editingPricing ? 'updated' : 'created'} successfully.`,
      });
      onUpdate?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: async (data: PromoCodeFormData) => {
      const url = editingPromo 
        ? `/api/admin/pricing/promo-codes/${editingPromo.id}`
        : '/api/admin/pricing/promo-codes';
      const method = editingPromo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save promo code');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing/promo-codes'] });
      setShowPromoDialog(false);
      setEditingPromo(null);
      promoForm.reset();
      toast({
        title: "Success",
        description: `Promo code ${editingPromo ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const url = editingCampaign 
        ? `/api/admin/pricing/campaigns/${editingCampaign.id}`
        : '/api/admin/pricing/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing/campaigns'] });
      setShowCampaignDialog(false);
      setEditingCampaign(null);
      campaignForm.reset();
      toast({
        title: "Success",
        description: `Campaign ${editingCampaign ? 'updated' : 'created'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'seats' | 'promo-codes' | 'campaigns', id: number }) => {
      const response = await fetch(`/api/admin/pricing/${type}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error(`Failed to delete ${type}`);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/pricing/${variables.type}`] });
      toast({
        title: "Success",
        description: "Item deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditPricing = (pricing: SeatPricing) => {
    setEditingPricing(pricing);
    pricingForm.reset({
      pricePerSeat: pricing.pricePerSeat,
      features: pricing.features,
      isActive: pricing.isActive,
    });
    setShowPricingDialog(true);
  };

  const handleEditPromo = (promo: PromoCode) => {
    setEditingPromo(promo);
    promoForm.reset({
      code: promo.code,
      discountType: promo.discountType,
      discountValue: Number(promo.discountValue),
      validFrom: promo.validFrom.split('T')[0],
      validTo: promo.validTo.split('T')[0],
      usageLimit: promo.usageLimit || undefined,
      tenantRestrictions: promo.tenantRestrictions || [],
      isActive: promo.isActive,
    });
    setShowPromoDialog(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    campaignForm.reset({
      name: campaign.name,
      description: campaign.description || "",
      trialDays: campaign.trialDays,
      defaultSeats: campaign.defaultSeats,
      pricePerSeat: campaign.pricePerSeat,
      startDate: campaign.startDate?.split('T')[0] || "",
      endDate: campaign.endDate?.split('T')[0] || "",
      isActive: campaign.isActive,
    });
    setShowCampaignDialog(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="seats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="seats">Seat Pricing</TabsTrigger>
          <TabsTrigger value="promos">Promo Codes</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        {/* Seat Pricing Tab */}
        <TabsContent value="seats" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Seat Pricing Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Manage the pricing model for seat-based subscriptions
              </p>
            </div>
            <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPricing(null);
                  pricingForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pricing Tier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPricing ? 'Edit' : 'Create'} Seat Pricing
                  </DialogTitle>
                  <DialogDescription>
                    Configure the pricing and features for seat-based subscriptions.
                  </DialogDescription>
                </DialogHeader>

                <Form {...pricingForm}>
                  <form onSubmit={pricingForm.handleSubmit((data) => createPricingMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={pricingForm.control}
                      name="pricePerSeat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Seat (pence)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="300 (£3.00)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={pricingForm.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Features (one per line)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              value={field.value.join('\n')}
                              onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                              placeholder="Basic shift scheduling&#10;Staff management&#10;Time tracking"
                              rows={6}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowPricingDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPricingMutation.isPending}>
                        {createPricingMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Price per Seat</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : seatPricing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No seat pricing configurations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    seatPricing.map((pricing: SeatPricing) => (
                      <TableRow key={pricing.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <PoundSterling className="h-4 w-4 text-green-600" />
                            {(pricing.pricePerSeat / 100).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {pricing.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="text-sm">{feature}</div>
                            ))}
                            {pricing.features.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{pricing.features.length - 3} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pricing.isActive ? "default" : "secondary"}>
                            {pricing.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(pricing.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPricing(pricing)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteMutation.mutate({ type: 'seats', id: pricing.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Similar tabs for Promo Codes and Campaigns would be implemented here */}
        {/* For brevity, showing structure only */}
        <TabsContent value="promos">
          <div className="text-center py-8 text-muted-foreground">
            Promo Codes management interface will be implemented here
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="text-center py-8 text-muted-foreground">
            Marketing Campaigns management interface will be implemented here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}