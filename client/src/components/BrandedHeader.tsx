import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

interface BrandedHeaderProps {
  businessName?: string;
  businessLogoUrl?: string;
}

export const BrandedHeader: React.FC<BrandedHeaderProps> = ({
  businessName: propBusinessName,
  businessLogoUrl: propBusinessLogoUrl,
}) => {
  const { tenantId } = useAuth();

  const { data: businessProfile } = useQuery({
    queryKey: ["/api/business-profile", tenantId],
    enabled: !!tenantId && !propBusinessName, // Only fetch if props not provided
  });

  // Use props if provided, otherwise fall back to context data
  const businessName = propBusinessName || businessProfile?.name || "ShiftFlo";
  const businessLogoUrl = propBusinessLogoUrl || businessProfile?.logoUrl;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand area */}
        <div className="flex items-center space-x-3">
          {businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt={`${businessName} logo`}
              className="h-10 w-auto object-contain rounded-md"
            />
          ) : (
            <span className="text-xl font-semibold text-gray-900">
              {businessName}
            </span>
          )}
          <span className="text-xs text-gray-500">
            powered by ShiftFlo
          </span>
        </div>

        {/* Notification bell */}
        <div className="flex items-center">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};