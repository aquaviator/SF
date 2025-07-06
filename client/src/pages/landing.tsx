import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  MapPin,
  Bell,
  TrendingUp,
  UserCheck,
  Timer,
  Eye,
  Zap,
  ArrowRight,
  Mail,
  Menu,
  X,
  Play,
  RefreshCw,
  Lock,
  Globe,
  Headphones
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const handleTrialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !subdomain) return;
    
    setIsSubmitting(true);
    try {
      // Redirect to business registration with pre-filled data
      window.location.href = `/register?email=${encodeURIComponent(email)}&subdomain=${encodeURIComponent(subdomain)}`;
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SF</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">ShiftFlo</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Sign In
              </Link>
              <Link href="/register" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Business Registration
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                Cookie Policy
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="space-y-2">
                <Link href="/login" className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Sign In
                </Link>
                <Link href="/register" className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Business Registration
                </Link>
                <Link href="/terms" className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Terms & Conditions
                </Link>
                <Link href="/privacy" className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Privacy Policy
                </Link>
                <Link href="/cookies" className="block py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                  Cookie Policy
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Complete Workforce Management Made Simple with ShiftFlo
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Complete Workforce Management
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Made Simple with ShiftFlo
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Smart scheduling, real-time operations, and seat-based pricing—no surprises.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Try the Sandbox
              </Button>
            </div>

            {/* Animation Placeholder */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                [Animated GIF: drag-drop scheduling → live ops dashboard]
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Workforce Management
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Four comprehensive feature blocks designed for businesses that take workforce management seriously
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Smart Scheduling */}
            <Card className="border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Smart Scheduling</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Intelligent shift planning with drag-and-drop calendar interface and automated conflict detection.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Conflict detection & shift templates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Automated staff assignment
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Drag-and-drop calendar interface
                  </li>
                </ul>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center text-sm text-gray-500">
                  [GIF Placeholder]
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Operations */}
            <Card className="border-2 hover:border-green-200 dark:hover:border-green-800 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Real-Time Operations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Mission control dashboard with live coverage tracking and instant shift reassignments.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Live coverage & attendance tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Strike & policy violation alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Instant shift reassignments
                  </li>
                </ul>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center text-sm text-gray-500">
                  [GIF Placeholder]
                </div>
              </CardContent>
            </Card>

            {/* Mobile-First Staff Tools */}
            <Card className="border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Mobile-First Staff Tools</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Comprehensive mobile tools for staff with instant notifications and request management.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Clock-in/out from any device
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Holiday & swap requests on the go
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Automated reminders & notifications
                  </li>
                </ul>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center text-sm text-gray-500">
                  [GIF Placeholder]
                </div>
              </CardContent>
            </Card>

            {/* Business Control & Policy Engine */}
            <Card className="border-2 hover:border-orange-200 dark:hover:border-orange-800 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-xl">Business Control & Policy Engine</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Complete business management with centralized policies and detailed reporting systems.
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Centralized policy management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Unlimited locations & role-based access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Detailed reporting & audit logs
                  </li>
                </ul>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center text-sm text-gray-500">
                  [GIF Placeholder]
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Simple Seat-Based Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Just £3.00 per active staff member per month. No hidden fees; all features included.
          </p>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">£3.00</div>
                <div className="text-gray-600 dark:text-gray-400 mb-6">per seat per month</div>
                
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Unlimited locations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>24/7 support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>No setup fees</span>
                  </li>
                </ul>
                
                <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Start Free Trial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sandbox Interactive Demo */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Experience ShiftFlo Firsthand
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Experience ShiftFlo firsthand—no signup required.
            </p>
          </div>
          
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  [Iframe or React component at /sandbox]
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Use the 'Reset Demo' button to start fresh.
                </p>
                <Button variant="outline" className="mr-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Demo
                </Button>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Try the Sandbox
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Trusted & Secure
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Trusted & secure—TLS encryption, GDPR compliant.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-300">Always here when you need us</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unlimited Locations</h3>
              <p className="text-gray-600 dark:text-gray-300">Scale across multiple sites</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Enterprise-Grade Uptime</h3>
              <p className="text-gray-600 dark:text-gray-300">Reliable when you need it most</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workforce Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using ShiftFlo to streamline their operations.
          </p>
          
          <form onSubmit={handleTrialSignup} className="max-w-md mx-auto mb-8">
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Business email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white"
                required
              />
              <Input
                type="text"
                placeholder="Desired subdomain (e.g., yourcompany)"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="bg-white"
                required
              />
              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-white text-blue-600 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Timer className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Start Free Trial
              </Button>
            </div>
          </form>
          
          <Link href="/demo" className="text-blue-100 hover:text-white underline">
            Request a Demo
          </Link>
          <span className="text-blue-200 mx-2">•</span>
          <span className="text-blue-100">Perfect for larger teams</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SF</span>
                </div>
                <span className="text-xl font-bold">ShiftFlo</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Complete workforce management made simple. Smart scheduling, real-time operations, and seat-based pricing—no surprises.
              </p>
            </div>
            
            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/demo" className="hover:text-white">Request Demo</Link></li>
              </ul>
            </div>
            
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ShiftFlo. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}