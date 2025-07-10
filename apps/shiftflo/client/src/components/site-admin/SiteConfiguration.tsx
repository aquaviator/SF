import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Globe, 
  CreditCard,
  Shield,
  Save,
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Loader2
} from "lucide-react";

interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedBy: number;
  updatedAt: string;
}

interface SeatPricing {
  id: number;
  tierName: string;
  minSeats: number;
  maxSeats: number | null;
  pricePerSeat: number;
  features: string[];
  isActive: boolean;
}

interface PromoCode {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  timesUsed: number;
  tenantRestrictions: string[] | null;
  isActive: boolean;
}

export function SiteConfiguration() {
  const [activeTab, setActiveTab] = useState("system");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platform settings
  const { data: settings, isLoading: settingsLoading } = useQuery<PlatformSetting[]>({
    queryKey: ['/api/admin/platform-settings'],
    retry: false,
  });

  // Fetch seat pricing
  const { data: seatPricing, isLoading: pricingLoading } = useQuery<SeatPricing[]>({
    queryKey: ['/api/admin/seat-pricing'],
    retry: false,
  });

  // Fetch promo codes
  const { data: promoCodes, isLoading: promoLoading } = useQuery<PromoCode[]>({
    queryKey: ['/api/admin/promo-codes'],
    retry: false,
  });

  // Update platform setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const response = await fetch(`/api/admin/platform-settings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Setting Updated",
        description: "Platform setting has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update seat pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SeatPricing> }) => {
      const response = await fetch(`/api/admin/seat-pricing/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update pricing');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pricing Updated",
        description: "Seat pricing has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seat-pricing'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create promo code mutation
  const createPromoMutation = useMutation({
    mutationFn: async (data: Partial<PromoCode>) => {
      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create promo code');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Promo Code Created",
        description: "New promotional code has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveSetting = (setting: PlatformSetting, newValue: string) => {
    updateSettingMutation.mutate({ id: setting.id, value: newValue });
  };

  const handleAddPromoCode = () => {
    // For now, create a sample promo code
    const newPromo = {
      code: `PROMO${Date.now()}`,
      discountType: 'percentage' as const,
      discountValue: 10,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: 100,
      isActive: true,
    };
    createPromoMutation.mutate(newPromo);
  };

  const renderSystemSettings = () => {
    if (settingsLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    const systemSettings = settings?.filter(s => s.category === 'system') || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Control fundamental platform behaviors and operational settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemSettings.length > 0 ? (
              systemSettings.map(setting => (
                <SettingRow 
                  key={setting.id} 
                  setting={setting} 
                  onSave={(value) => handleSaveSetting(setting, value)}
                  isLoading={updateSettingMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                System settings will be loaded from database when available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBillingSettings = () => {
    if (pricingLoading) {
      return (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Seat Pricing Tiers
            </CardTitle>
            <CardDescription>
              Configure subscription pricing tiers and features for different seat volumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {seatPricing && seatPricing.length > 0 ? (
                seatPricing.map(tier => (
                  <div key={tier.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{tier.tierName}</h3>
                      <Badge variant={tier.isActive ? "default" : "secondary"}>
                        {tier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Seats:</span> {tier.minSeats} - {tier.maxSeats || "Unlimited"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span> £{tier.pricePerSeat}/seat/month
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tier.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Seat pricing configuration will be loaded from database
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Promotional Codes
            </CardTitle>
            <CardDescription>
              Manage discount codes and promotional offers for new customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleAddPromoCode} 
                className="flex items-center gap-2"
                disabled={createPromoMutation.isPending}
              >
                {createPromoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Promo Code
              </Button>
              {promoCodes && promoCodes.length > 0 ? (
                promoCodes.map(promo => (
                  <div key={promo.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold">{promo.code}</code>
                        <Badge variant={promo.isActive ? "default" : "secondary"}>
                          {promo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Discount:</span> {promo.discountValue}{promo.discountType === 'percentage' ? '%' : ' £'} off
                      </div>
                      <div>
                        <span className="text-muted-foreground">Usage:</span> {promo.timesUsed}/{promo.usageLimit || "Unlimited"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valid:</span> {promo.validFrom} to {promo.validTo}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Promotional codes will be loaded from database
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderIntegrationSettings = () => {
    const integrationSettings = settings?.filter(s => s.category === 'integrations') || [];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              External Integrations
            </CardTitle>
            <CardDescription>
              Configure third-party service integrations and API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrationSettings.length > 0 ? (
              integrationSettings.map(setting => (
                <SettingRow 
                  key={setting.id} 
                  setting={setting} 
                  onSave={(value) => handleSaveSetting(setting, value)}
                  isLoading={updateSettingMutation.isPending}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Integration settings will be loaded from database when available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Access
          </CardTitle>
          <CardDescription>
            Configure security policies and access controls for the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <Label className="font-medium">Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground mb-2">Require 2FA for all admin accounts</p>
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <span className="text-sm">Enabled</span>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <Label className="font-medium">Session Timeout</Label>
            <p className="text-sm text-muted-foreground mb-2">Admin session timeout in minutes</p>
            <div className="flex items-center gap-2">
              <Input defaultValue="30" className="w-24" />
              <span className="text-sm">minutes</span>
              <Button size="sm">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <Label className="font-medium">IP Whitelist</Label>
            <p className="text-sm text-muted-foreground mb-2">Restrict admin access to specific IP addresses</p>
            <Textarea placeholder="192.168.1.0/24&#10;10.0.0.0/8" className="mt-2" />
            <Button size="sm" className="mt-2">
              <Save className="h-4 w-4 mr-2" />
              Update Whitelist
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          Site Configuration
        </CardTitle>
        <CardDescription>
          Manage global platform settings, pricing, and configuration options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="mt-6">
            {renderSystemSettings()}
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            {renderBillingSettings()}
          </TabsContent>

          <TabsContent value="integrations" className="mt-6">
            {renderIntegrationSettings()}
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            {renderSecuritySettings()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper component for individual setting rows
function SettingRow({ 
  setting, 
  onSave, 
  isLoading 
}: { 
  setting: PlatformSetting; 
  onSave: (value: string) => void; 
  isLoading: boolean;
}) {
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    if (value !== setting.value) {
      onSave(value);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <Label className="font-medium">{setting.description}</Label>
        <p className="text-sm text-muted-foreground">{setting.key}</p>
      </div>
      <div className="flex items-center gap-2">
        {setting.key.includes('_mode') || setting.key.includes('_enabled') ? (
          <Switch 
            checked={value === 'true'} 
            onCheckedChange={(checked) => setValue(checked ? 'true' : 'false')}
          />
        ) : (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            className="w-32" 
          />
        )}
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isLoading || value === setting.value}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}