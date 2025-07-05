import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import ShiftFloLogo from "@/components/ShiftFloLogo";

export function BrandedHeader() {
  const { tenantId } = useAuth();

  // Fetch business profile for logo and name
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile", tenantId],
    queryFn: () => fetch(`/api/business-profile?tenantId=${tenantId}`).then(res => res.json()),
    enabled: !!tenantId,
  });

  const businessName = businessProfile?.name || tenantId?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Your Business';
  const logoUrl = businessProfile?.logoUrl;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        {/* Left: Business Branding */}
        <div className="flex items-center space-x-3">
          {/* Business Logo */}
          {logoUrl ? (
            <div className="flex items-center space-x-3">
              <img
                src={logoUrl}
                alt={`${businessName} logo`}
                className="h-10 w-auto object-contain rounded-md"
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                  {businessName}
                </h1>
                <p className="text-xs text-gray-500 leading-tight">
                  powered by ShiftFlo
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* ShiftFlo logo fallback */}
              <ShiftFloLogo 
                width={40} 
                height={40} 
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                  {businessName}
                </h1>
                <p className="text-xs text-gray-500 leading-tight">
                  powered by ShiftFlo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Center: Mobile Business Name (when sidebar is hidden) */}
        <div className="flex-1 text-center md:hidden">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {businessName}
          </h1>
          <p className="text-xs text-gray-500">
            powered by ShiftFlo
          </p>
        </div>

        {/* Right: Notifications */}
        <div className="flex items-center space-x-2">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}