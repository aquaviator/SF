import { useState } from "react";
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
  ChevronRight,
  ArrowLeft,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Zap,
  ExternalLink,
  LogIn
} from "lucide-react";
import { Link } from "wouter";

interface PublicHelpSection {
  id: string;
  title: string;
  icon: any;
  content: PublicHelpContent[];
  audience: 'both' | 'staff' | 'managers';
}

interface PublicHelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
}

const publicHelpSections: PublicHelpSection[] = [
  {
    id: "overview",
    title: "What is ShiftFlo?",
    icon: BookOpen,
    audience: "both",
    content: [
      {
        title: "Platform Overview",
        description: "ShiftFlo is a comprehensive workforce management platform designed for modern businesses.",
        steps: [
          "Mobile-first design optimized for smartphones and tablets",
          "Real-time shift scheduling and management",
          "Automated time tracking with policy enforcement",
          "Staff self-service portal for requests and swaps",
          "Manager dashboard with live operations monitoring",
          "Seat-based subscription model (£3.00 per staff member per month)"
        ]
      },
      {
        title: "Key Benefits",
        description: "Why businesses choose ShiftFlo for workforce management.",
        steps: [
          "Reduce scheduling conflicts with intelligent conflict detection",
          "Improve staff satisfaction with self-service features",
          "Automate attendance tracking and policy enforcement",
          "Gain real-time visibility into operations",
          "Scale easily with seat-based pricing",
          "Access from any device with responsive design"
        ]
      }
    ]
  },
  {
    id: "for-staff",
    title: "For Staff Members",
    icon: Users,
    audience: "staff",
    content: [
      {
        title: "Getting Started as Staff",
        description: "Everything staff need to know about using ShiftFlo.",
        steps: [
          "Receive activation email from your manager",
          "Click activation link and set your password",
          "Complete your profile with photo and details",
          "View your schedule in the My Work section",
          "Learn to clock in/out for shifts",
          "Submit holiday and swap requests"
        ]
      },
      {
        title: "Daily Workflow",
        description: "Typical day-to-day activities for staff members.",
        steps: [
          "Check upcoming shifts and any schedule changes",
          "Clock in when arriving for shifts",
          "Take breaks and track time accurately",
          "Clock out at end of shift",
          "Claim available opportunity shifts",
          "Submit requests for time off or shift swaps"
        ]
      },
      {
        title: "Self-Service Features",
        description: "Tasks staff can handle independently.",
        steps: [
          "Request holiday time with priority levels",
          "Propose shift swaps with colleagues",
          "Claim extra opportunity shifts",
          "View strike points and attendance history",
          "Update personal profile and contact information",
          "Access help documentation and support"
        ]
      }
    ]
  },
  {
    id: "for-managers",
    title: "For Managers",
    icon: Shield,
    audience: "managers",
    content: [
      {
        title: "Business Setup",
        description: "Initial configuration for new businesses with detailed navigation steps.",
        steps: [
          "Visit /register to complete business registration with company details and owner account setup",
          "Navigate to Owner > Profile to set up business profile, upload logo, and configure branding",
          "Go to Owner > Business Settings to create locations (with addresses) and job roles (titles and descriptions)",
          "Access Owner > Policies to set operating hours (daily schedules) and configure shift/time tracking policies",
          "Use Owner > Workforce to invite staff by entering email addresses for activation emails",
          "Visit Owner > Subscription to manage seat-based billing at £3.00 per active staff member per month"
        ]
      },
      {
        title: "Daily Operations",
        description: "Managing day-to-day workforce operations.",
        steps: [
          "Monitor Live Operations dashboard",
          "Create and assign shifts to staff",
          "Approve holiday and swap requests",
          "Track staff attendance and strikes",
          "Handle escalations and coverage issues",
          "Review analytics and performance reports"
        ]
      },
      {
        title: "Advanced Features",
        description: "Powerful tools for efficient management.",
        steps: [
          "Set up shift templates for recurring schedules",
          "Configure time tracking policies and automation",
          "Monitor strike system and attendance compliance",
          "Use analytics for workforce planning",
          "Manage seat-based subscription billing",
          "Access comprehensive help documentation"
        ]
      }
    ]
  },
  {
    id: "features",
    title: "Key Features",
    icon: Zap,
    audience: "both",
    content: [
      {
        title: "Shift Management",
        description: "Comprehensive scheduling and shift assignment tools.",
        steps: [
          "Drag-and-drop calendar interface",
          "Automatic conflict detection",
          "Shift templates for recurring schedules",
          "Real-time assignment confirmations",
          "Opportunity shifts for extra coverage",
          "Mobile-optimized shift viewing"
        ]
      },
      {
        title: "Time Tracking",
        description: "Automated attendance and policy enforcement.",
        steps: [
          "Mobile clock-in/out with buffer windows",
          "Break tracking and time calculations",
          "Policy-driven strike system",
          "Late arrival and no-show detection",
          "Manager override capabilities",
          "Comprehensive time entry history"
        ]
      },
      {
        title: "Request Management",
        description: "Streamlined approval workflows.",
        steps: [
          "Holiday requests with priority levels",
          "Shift swap requests between staff",
          "Automated email notifications",
          "Manager approval dashboard",
          "Request status tracking",
          "Bulk approval capabilities"
        ]
      },
      {
        title: "Live Operations",
        description: "Real-time business monitoring and control.",
        steps: [
          "Shift coverage monitoring",
          "Staff status tracking",
          "Strike alerts and compliance monitoring",
          "Request queue management",
          "Escalation handling",
          "Auto-refresh dashboards"
        ]
      }
    ]
  },
  {
    id: "pricing",
    title: "Pricing & Billing",
    icon: CreditCard,
    audience: "managers",
    content: [
      {
        title: "Seat-Based Pricing",
        description: "Simple, transparent pricing based on active staff members.",
        steps: [
          "£3.00 per staff member per month",
          "Only pay for active staff seats",
          "Add or remove seats as needed",
          "No setup fees or hidden costs",
          "Monthly billing with usage tracking",
          "Free trial available for new businesses"
        ]
      },
      {
        title: "What's Included",
        description: "Everything you need for workforce management.",
        steps: [
          "Unlimited shifts and scheduling",
          "Complete time tracking system",
          "Request management workflows",
          "Live operations monitoring",
          "Mobile-responsive interface",
          "Email support and documentation"
        ]
      }
    ]
  },
  {
    id: "getting-started",
    title: "Getting Started",
    icon: ExternalLink,
    audience: "both",
    content: [
      {
        title: "For New Businesses",
        description: "Steps to get your business up and running on ShiftFlo.",
        steps: [
          "Visit /register to access the business registration page",
          "Enter your business details and manager account information",
          "Submit registration and check email for activation link",
          "Click activation link, set your password, and complete account setup",
          "Navigate through Owner menus to complete business configuration (Profile, Business Settings, Policies)",
          "Use Owner > Workforce to send invitation emails to your first staff members"
        ]
      },
      {
        title: "For Staff Members",
        description: "How staff members join and start using ShiftFlo.",
        steps: [
          "Receive invitation email from your manager",
          "Click the activation link in the email",
          "Set your password and complete profile",
          "Explore the My Work dashboard",
          "Explore the help documentation and features",
          "Start using time tracking and requests"
        ]
      }
    ]
  },
  {
    id: "support",
    title: "Support & Resources",
    icon: MessageSquare,
    audience: "both",
    content: [
      {
        title: "Getting Help",
        description: "Available support options and resources.",
        steps: [
          "Comprehensive help documentation (available 24/7)",
          "Email support during business hours",
          "Video tutorials and guides",
          "System status and updates",
          "Feature request submission",
          "Community best practices"
        ]
      },
      {
        title: "Contact Information",
        description: "How to reach our support team.",
        steps: [
          "Email: Support available through your manager",
          "Help Documentation: Accessible from within the platform",
          "Business Hours: Monday-Friday, 9 AM - 5 PM GMT",
          "Response Time: Typically within 24 hours",
          "Urgent Issues: Contact your direct manager first",
          "Technical Issues: Include screenshots when possible"
        ]
      }
    ]
  }
];

export default function PublicHelp() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<'both' | 'staff' | 'managers'>('both');

  // Filter sections based on audience and search term
  const filteredSections = publicHelpSections.filter(section => {
    const audienceMatch = selectedAudience === 'both' || section.audience === 'both' || section.audience === selectedAudience;
    const searchMatch = searchTerm === "" || 
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.some(content => 
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return audienceMatch && searchMatch;
  });

  const selectedSectionData = selectedSection 
    ? publicHelpSections.find(s => s.id === selectedSection)
    : null;

  if (selectedSection && selectedSectionData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
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
            <Link href="/login" className="ml-auto">
              <Button variant="outline" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login to ShiftFlo
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <selectedSectionData.icon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedSectionData.title}</h1>
              <Badge variant={selectedSectionData.audience === 'managers' ? 'destructive' : 'default'} className="mt-2">
                {selectedSectionData.audience === 'both' ? 'All Users' : 
                 selectedSectionData.audience === 'managers' ? 'Managers' : 'Staff'}
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
                      <h4 className="font-semibold text-gray-900 mb-3">Key Points:</h4>
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
                        Tips:
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">ShiftFlo Help Center</h1>
          <p className="text-xl text-gray-600">
            Comprehensive workforce management for modern businesses
          </p>
          <div className="flex justify-center">
            <Link href="/login">
              <Button className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login to ShiftFlo
              </Button>
            </Link>
          </div>
        </div>

        {/* Audience Filter */}
        <div className="flex justify-center space-x-2">
          <Button 
            variant={selectedAudience === 'both' ? 'default' : 'outline'} 
            onClick={() => setSelectedAudience('both')}
            size="sm"
          >
            All Topics
          </Button>
          <Button 
            variant={selectedAudience === 'staff' ? 'default' : 'outline'} 
            onClick={() => setSelectedAudience('staff')}
            size="sm"
          >
            For Staff
          </Button>
          <Button 
            variant={selectedAudience === 'managers' ? 'default' : 'outline'} 
            onClick={() => setSelectedAudience('managers')}
            size="sm"
          >
            For Managers
          </Button>
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
              <div className="text-2xl font-bold text-green-600">£3.00</div>
              <div className="text-sm text-gray-600">Per Seat Per Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-600">Documentation Access</div>
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
                          variant={section.audience === 'managers' ? 'destructive' : 'default'} 
                          className="text-xs mt-1"
                        >
                          {section.audience === 'both' ? 'All Users' : 
                           section.audience === 'managers' ? 'Managers' : 'Staff'}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">
                    {section.content[0]?.description || "Comprehensive guides and information"}
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
              onClick={() => {
                setSearchTerm("");
                setSelectedAudience('both');
              }}
              className="mt-4"
            >
              Show All Topics
            </Button>
          </div>
        )}

        {/* Call to Action */}
        <Separator />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to get started?</h3>
          <p className="text-blue-700 mb-4">
            Join thousands of businesses using ShiftFlo for better workforce management.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login to Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}