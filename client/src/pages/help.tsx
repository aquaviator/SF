import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  BarChart3, 
  CreditCard,
  Shield,
  Bell,
  MapPin,
  UserCheck,
  Mail,
  Phone,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Zap
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: HelpContent[];
  userType: 'both' | 'staff' | 'owner';
}

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

const helpSections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    userType: "both",
    content: [
      {
        title: "First Time Login",
        description: "Welcome to ShiftFlo! Here's how to get started with your account.",
        steps: [
          "Log in using your email and password provided by your manager",
          "Complete your profile by adding a photo and personal details",
          "Review your work schedule in the My Work section",
          "Familiarize yourself with the mobile-friendly interface",
          "Explore the help documentation for guidance"
        ],
        tips: [
          "Keep your profile updated for better team communication",
          "Check the My Work dashboard regularly for schedule updates"
        ]
      },
      {
        title: "Navigation Basics",
        description: "Learn how to navigate ShiftFlo on mobile and desktop devices.",
        steps: [
          "Use the bottom tab bar on mobile devices",
          "Access additional features through the 'More' button",
          "On desktop, use the sidebar navigation on the left",
          "The current page is highlighted in blue",
          "Use the back button or breadcrumbs to navigate back"
        ]
      }
    ]
  },
  {
    id: "my-work",
    title: "My Work Hub",
    icon: Calendar,
    userType: "staff",
    content: [
      {
        title: "Overview Dashboard",
        description: "Your personal work dashboard shows upcoming shifts, hours, and activity.",
        steps: [
          "View upcoming shifts and countdown timers",
          "Check your weekly and monthly hours progress",
          "See recent work activity and updates",
          "Monitor your Quick Stats for performance metrics",
          "Access quick actions for common tasks"
        ]
      },
      {
        title: "Time Tracking",
        description: "Clock in and out of shifts with policy-driven controls.",
        steps: [
          "Navigate to the Time Tracking tab",
          "Clock in when you arrive for your shift",
          "Take breaks and resume work as needed",
          "Clock out at the end of your shift",
          "Review your time entries history"
        ],
        tips: [
          "Clock in within the buffer window to avoid late marks",
          "Use break tracking for accurate time records",
          "Check your time tracking policies for specific rules"
        ]
      },
      {
        title: "My Shifts",
        description: "View and manage your assigned shifts and schedules.",
        steps: [
          "See all your confirmed and pending shifts",
          "Filter shifts by Today, Week, Upcoming, or Completed",
          "Click on any shift to view details",
          "Accept or decline shift assignments",
          "View shift location, role, and requirements"
        ]
      },
      {
        title: "Holiday Requests",
        description: "Request time off and track approval status.",
        steps: [
          "Click 'Submit Request' to create a new holiday request",
          "Select request type (Vacation, Sick, Emergency, etc.)",
          "Choose start and end dates",
          "Set priority level and add reason",
          "Submit and track approval status"
        ]
      },
      {
        title: "Swap Requests",
        description: "Request to swap shifts with other team members.",
        steps: [
          "Click 'Request Swap' to start a shift exchange",
          "Select your shift that you want to swap",
          "Choose another shift you'd like to take instead",
          "Provide a reason for the swap request",
          "Wait for management approval"
        ]
      }
    ]
  },
  {
    id: "opportunities",
    title: "Opportunities",
    icon: Zap,
    userType: "staff",
    content: [
      {
        title: "Claiming Extra Shifts",
        description: "Pick up additional shifts that become available.",
        steps: [
          "Browse available opportunity shifts",
          "Check shift details, location, and requirements",
          "Click 'Claim' to request the shift",
          "Wait for confirmation from management",
          "View claimed shifts in your My Work schedule"
        ],
        tips: [
          "Act quickly - opportunities are first-come, first-served",
          "Check your strike points - too many strikes may prevent claiming",
          "Consider travel time when claiming shifts at different locations"
        ]
      }
    ]
  },
  {
    id: "time-tracking",
    title: "Time & Attendance",
    icon: Clock,
    userType: "both",
    content: [
      {
        title: "Clock In/Out Process",
        description: "How to properly track your work time.",
        steps: [
          "Arrive at your scheduled location",
          "Open ShiftFlo and go to Time Tracking",
          "Click 'Clock In' when you start work",
          "Use 'Break' buttons for meal and rest breaks",
          "Click 'Clock Out' when your shift ends"
        ],
        tips: [
          "Clock in within the allowed buffer time to avoid late marks",
          "Always clock out - forgotten clock-outs may result in strikes",
          "Take breaks as required by your workplace policies"
        ]
      },
      {
        title: "Strike System",
        description: "Understanding the attendance and punctuality tracking system.",
        steps: [
          "Strikes are automatically assigned for policy violations",
          "Late arrivals result in 1 strike point",
          "No-shows result in 2 strike points",
          "Strikes expire after the reset period (typically 90 days)",
          "Too many strikes may prevent claiming additional shifts"
        ]
      }
    ]
  },
  {
    id: "owner-dashboard",
    title: "Owner Dashboard",
    icon: BarChart3,
    userType: "owner",
    content: [
      {
        title: "Business Overview",
        description: "Monitor your business performance and key metrics.",
        steps: [
          "View active shifts and coverage statistics",
          "Monitor staff status and time tracking",
          "Check pending requests requiring approval",
          "Review recent business activity",
          "Access quick actions for common tasks"
        ]
      },
      {
        title: "Quick Actions",
        description: "Efficiently manage common business tasks.",
        steps: [
          "Create shifts quickly from the dashboard",
          "Add new staff members with email invitations",
          "View detailed analytics and reports",
          "Approve holiday and swap requests",
          "Access Live Operations for real-time monitoring"
        ]
      }
    ]
  },
  {
    id: "live-operations",
    title: "Live Operations",
    icon: Users,
    userType: "owner",
    content: [
      {
        title: "Mission Control",
        description: "Real-time monitoring and management of your business operations.",
        steps: [
          "Monitor shift coverage in real-time",
          "Track staff clock-in/out status",
          "View strike alerts and attendance issues",
          "Manage the request queue for approvals",
          "Handle escalations requiring immediate attention"
        ],
        tips: [
          "Check Live Operations regularly during business hours",
          "Set up auto-refresh for continuous monitoring",
          "Address escalations promptly to maintain operations"
        ]
      }
    ]
  },
  {
    id: "scheduling",
    title: "Scheduling",
    icon: Calendar,
    userType: "owner",
    content: [
      {
        title: "Creating Shifts",
        description: "Schedule staff shifts and assignments.",
        steps: [
          "Go to Owner > Scheduling",
          "Click 'Create Shift' or use the calendar",
          "Select date, time, and location",
          "Choose job role and assign staff member",
          "Add shift description and requirements",
          "Save to notify assigned staff"
        ]
      },
      {
        title: "Shift Templates",
        description: "Create reusable shift patterns for efficiency.",
        steps: [
          "Create templates for recurring shift patterns",
          "Set up weekly, bi-weekly, or monthly schedules",
          "Apply templates to generate multiple shifts",
          "Customize individual shifts as needed",
          "Use templates for seasonal staffing patterns"
        ]
      },
      {
        title: "Calendar Management",
        description: "Visual scheduling and conflict management.",
        steps: [
          "View shifts in calendar format",
          "Drag and drop to reschedule shifts",
          "Identify scheduling conflicts automatically",
          "Color-coded shifts by status and role",
          "Export schedules for external planning"
        ]
      }
    ]
  },
  {
    id: "workforce",
    title: "Workforce Management",
    icon: Users,
    userType: "owner",
    content: [
      {
        title: "Staff Management",
        description: "Add, manage, and organize your team members.",
        steps: [
          "Go to Owner > Workforce",
          "Click 'Add Staff' to invite new team members",
          "Enter email address for invitation",
          "Staff receive activation email with setup instructions",
          "View and manage all staff profiles"
        ]
      },
      {
        title: "Holiday Entitlements",
        description: "Manage staff holiday allowances and time off.",
        steps: [
          "Navigate to the Holiday Entitlements tab",
          "View all staff holiday balances",
          "Update annual entitlements as needed",
          "Track used vs. remaining holiday days",
          "Set entitlements for new staff members"
        ]
      },
      {
        title: "Strike Management",
        description: "Monitor staff attendance and policy compliance.",
        steps: [
          "View staff strike points and history",
          "Review automatic strikes for policy violations",
          "Manually adjust strikes when appropriate",
          "Set strike limits and consequences",
          "Monitor strike trends for policy improvements"
        ]
      }
    ]
  },
  {
    id: "business-settings",
    title: "Business Settings",
    icon: Settings,
    userType: "owner",
    content: [
      {
        title: "Business Profile",
        description: "Manage your business information and branding.",
        steps: [
          "Update business name and description",
          "Upload your business logo",
          "Set contact information",
          "Configure business hours",
          "Add business locations"
        ]
      },
      {
        title: "Job Roles & Locations",
        description: "Set up positions and workplace locations.",
        steps: [
          "Create job roles for your business",
          "Set role descriptions and requirements",
          "Add workplace locations with addresses",
          "Assign default roles to locations",
          "Update role information as needed"
        ]
      },
      {
        title: "Operating Hours",
        description: "Configure your business operating schedule.",
        steps: [
          "Set daily operating hours",
          "Configure different hours for weekdays/weekends",
          "Mark closed days",
          "Set holiday schedules",
          "Apply operating hours to shift scheduling"
        ]
      }
    ]
  },
  {
    id: "policies",
    title: "Policies",
    icon: Shield,
    userType: "owner",
    content: [
      {
        title: "Shift Policies",
        description: "Configure shift management and booking rules.",
        steps: [
          "Set minimum notice hours for shift bookings",
          "Configure maximum advance booking days",
          "Set shift duration limits",
          "Define cancellation policies",
          "Configure swap request rules"
        ]
      },
      {
        title: "Time Tracking Policies",
        description: "Set up attendance and punctuality rules.",
        steps: [
          "Configure clock-in buffer windows",
          "Set late grace periods",
          "Define strike reset periods",
          "Set strike point limits",
          "Configure automatic strike assignment"
        ]
      }
    ]
  },
  {
    id: "subscription",
    title: "Subscription & Billing",
    icon: CreditCard,
    userType: "owner",
    content: [
      {
        title: "Seat Management",
        description: "Manage your subscription and billing.",
        steps: [
          "View current seat usage and limits",
          "Add or remove seats as needed",
          "Review billing history and invoices",
          "Update payment methods",
          "Download receipts for accounting"
        ]
      },
      {
        title: "Usage Monitoring",
        description: "Track your platform usage and costs.",
        steps: [
          "Monitor monthly seat usage",
          "View feature usage statistics",
          "Track staff activity levels",
          "Review cost per seat calculations",
          "Plan for future scaling needs"
        ]
      }
    ]
  },

  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: HelpCircle,
    userType: "both",
    content: [
      {
        title: "Login Issues",
        description: "Common login problems and solutions.",
        steps: [
          "Ensure you're using the correct email address",
          "Check that your password is entered correctly",
          "Clear your browser cache and cookies",
          "Try using a different browser",
          "Contact your manager if you haven't received activation email"
        ]
      },
      {
        title: "Clock In/Out Problems",
        description: "Resolving time tracking issues.",
        steps: [
          "Ensure you have a stable internet connection",
          "Check that you're within the allowed clock-in window",
          "Verify your location if location tracking is enabled",
          "Refresh the page and try again",
          "Contact management if the issue persists"
        ]
      },
      {
        title: "Mobile Performance",
        description: "Optimizing ShiftFlo performance on mobile devices.",
        steps: [
          "Close unnecessary apps running in background",
          "Ensure you have the latest browser version",
          "Clear browser cache regularly",
          "Check your internet connection speed",
          "Use Wi-Fi when available for better performance"
        ]
      }
    ]
  },
  {
    id: "contact",
    title: "Contact & Support",
    icon: MessageSquare,
    userType: "both",
    content: [
      {
        title: "Getting Help",
        description: "How to get support when you need assistance.",
        steps: [
          "Check this help documentation first",
          "For urgent issues, contact your direct manager",
          "For technical problems, email support",
          "Include screenshots when reporting issues",
          "Provide your username and tenant information"
        ]
      },
      {
        title: "Support Channels",
        description: "Available support options and response times.",
        steps: [
          "Email Support: Responsive during business hours",
          "Manager Contact: For urgent operational issues",
          "Help Documentation: Available 24/7",
          "System Status: Check for known issues",
          "Feature Requests: Submit through your manager"
        ]
      }
    ]
  }
];

export default function Help() {
  const { role } = useRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Filter sections based on user role and search term
  const filteredSections = helpSections.filter(section => {
    const roleMatch = section.userType === 'both' || section.userType === role;
    const searchMatch = searchTerm === "" || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.some(content => 
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return roleMatch && searchMatch;
  });

  const selectedSectionData = selectedSection 
    ? helpSections.find(s => s.id === selectedSection)
    : null;

  if (selectedSection && selectedSectionData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedSection(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Help Topics
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <selectedSectionData.icon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{selectedSectionData.title}</h1>
            <Badge variant={selectedSectionData.userType === 'owner' ? 'destructive' : 'default'} className="mt-2">
              {selectedSectionData.userType === 'both' ? 'All Users' : 
               selectedSectionData.userType === 'owner' ? 'Managers' : 'Staff'}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {selectedSectionData.content.map((content, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">{content.title}</CardTitle>
                <p className="text-gray-600">{content.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.steps && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Step-by-Step Instructions:</h4>
                    <ol className="space-y-2">
                      {content.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {stepIndex + 1}
                          </span>
                          <span className="text-gray-700">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {content.tips && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Pro Tips:
                    </h4>
                    <ul className="space-y-1">
                      {content.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="text-yellow-700 text-sm">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">ShiftFlo Help Center</h1>
        <p className="text-xl text-gray-600">
          Everything you need to know about managing your work with ShiftFlo
        </p>
        <Badge variant={role === 'owner' ? 'destructive' : 'default'} className="text-sm">
          {role === 'owner' ? 'Manager View' : 'Staff View'}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search help topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredSections.length}</div>
            <div className="text-sm text-gray-600">Help Topics</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredSections.reduce((acc, section) => acc + section.content.length, 0)}
            </div>
            <div className="text-sm text-gray-600">Guides Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">24/7</div>
            <div className="text-sm text-gray-600">Available Support</div>
          </CardContent>
        </Card>
      </div>

      {/* Help Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
              onClick={() => setSelectedSection(section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <Badge 
                        variant={section.userType === 'owner' ? 'destructive' : 'default'} 
                        className="text-xs mt-1"
                      >
                        {section.userType === 'both' ? 'All Users' : 
                         section.userType === 'owner' ? 'Managers' : 'Staff'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  {section.content[0]?.description || "Comprehensive guides and instructions"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{section.content.length} guide{section.content.length !== 1 ? 's' : ''}</span>
                  <span>Click to explore →</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredSections.length === 0 && (
        <div className="text-center py-12">
          <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No help topics found</h3>
          <p className="text-gray-600">Try adjusting your search terms or browse all available topics.</p>
          <Button 
            variant="outline" 
            onClick={() => setSearchTerm("")}
            className="mt-4"
          >
            Show All Topics
          </Button>
        </div>
      )}

      {/* Contact Support */}
      <Separator />
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Still need help?</h3>
        <p className="text-blue-700 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Support
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact Manager
          </Button>
        </div>
      </div>
    </div>
  );
}