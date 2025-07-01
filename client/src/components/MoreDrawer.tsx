import { X, Shield, CreditCard, Activity, Settings, HelpCircle, Calendar, Briefcase, RefreshCw, TrendingUp, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DrawerItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  ariaLabel: string;
}

interface DrawerSection {
  title?: string;
  items: DrawerItem[];
  collapsible?: boolean;
}

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreDrawer({ isOpen, onClose }: MoreDrawerProps) {
  const { role } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [businessSettingsOpen, setBusinessSettingsOpen] = useState(false);

  // Focus trap and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus the first focusable element
    const firstFocusable = drawerRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const ownerSections: DrawerSection[] = [
    {
      title: "Management",
      items: [
        {
          icon: Shield,
          label: "Policies",
          path: "/owner/policies",
          ariaLabel: "Navigate to policies management"
        },
        {
          icon: CreditCard,
          label: "Subscription",
          path: "/owner/subscription",
          ariaLabel: "Navigate to subscription management"
        },
        {
          icon: Activity,
          label: "Activity Logs",
          path: "/owner/analytics",
          ariaLabel: "Navigate to activity logs"
        }
      ]
    },
    {
      title: "Business Settings",
      collapsible: true,
      items: [
        {
          icon: Settings,
          label: "Business Profile",
          path: "/owner/settings",
          ariaLabel: "Navigate to business profile settings"
        },
        {
          icon: Settings,
          label: "Job Roles",
          path: "/owner/settings?tab=roles",
          ariaLabel: "Navigate to job roles settings"
        },
        {
          icon: Settings,
          label: "Operating Hours",
          path: "/owner/settings?tab=hours",
          ariaLabel: "Navigate to operating hours settings"
        }
      ]
    },
    {
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          path: "/help",
          ariaLabel: "Navigate to help and support"
        }
      ]
    }
  ];

  const staffSections: DrawerSection[] = [
    {
      title: "My Work",
      items: [
        {
          icon: Calendar,
          label: "My Calendar",
          path: "/staff/calendar",
          ariaLabel: "Navigate to my calendar"
        },
        {
          icon: Briefcase,
          label: "Opportunities",
          path: "/opportunities",
          ariaLabel: "Navigate to shift opportunities"
        },
        {
          icon: RefreshCw,
          label: "Swap Requests",
          path: "/swap-requests",
          ariaLabel: "Navigate to swap requests"
        },
        {
          icon: TrendingUp,
          label: "My Performance",
          path: "/staff/performance",
          ariaLabel: "Navigate to my performance"
        }
      ]
    },
    {
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          path: "/help",
          ariaLabel: "Navigate to help and support"
        }
      ]
    }
  ];

  const sections = role === "owner" ? ownerSections : staffSections;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Drawer */}
      <div 
        ref={drawerRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg",
          "transform transition-transform duration-300 ease-out",
          "max-h-[70vh] overflow-y-auto safe-area-pb",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="drawer-title" className="text-lg font-semibold text-gray-900">
            More Options
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close more options menu"
            className="p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <nav className="p-4 space-y-6" role="navigation" aria-label="More options navigation">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <>
                  {section.collapsible ? (
                    <Collapsible 
                      open={businessSettingsOpen} 
                      onOpenChange={setBusinessSettingsOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-0 h-auto font-medium text-gray-700 hover:text-gray-900"
                          aria-expanded={businessSettingsOpen}
                        >
                          <span>{section.title}</span>
                          {businessSettingsOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              href={item.path}
                              onClick={onClose}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                "min-h-[48px]"
                              )}
                              aria-label={item.ariaLabel}
                            >
                              <Icon className="w-5 h-5 text-gray-500" />
                              <span className="font-medium">{item.label}</span>
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                      {section.title}
                    </h3>
                  )}
                </>
              )}
              
              {!section.collapsible && (
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          "min-h-[48px]"
                        )}
                        aria-label={item.ariaLabel}
                      >
                        <Icon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              
              {sectionIndex < sections.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}