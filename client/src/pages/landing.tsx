import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, Users, Clock, BarChart3, Shield, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ShiftFlo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/business-registration">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Smart Staff Scheduling
            <span className="text-blue-600 dark:text-blue-400"> Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Streamline your workforce management with intelligent scheduling, real-time tracking, 
            and powerful analytics. Built for modern businesses that value efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/business-registration">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Smart Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered scheduling that considers availability, skills, and business rules to create optimal shift plans.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Manage staff profiles, roles, and permissions with comprehensive workforce oversight tools.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time clock-in/out with policy-driven attendance tracking and automated strike management.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed insights into labor costs, productivity, and operational efficiency with actionable data.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Secure & Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Enterprise-grade security with multi-tenant architecture and compliance with data protection regulations.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle>Mobile First</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Responsive design optimized for mobile devices, perfect for staff on-the-go.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Preview */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Pay only for what you use. No hidden fees, no long-term contracts.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Starter</CardTitle>
                <div className="text-3xl font-bold">£3<span className="text-lg text-gray-500">/seat/month</span></div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Perfect for small teams (1-10 seats)</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-xl">Professional</CardTitle>
                <div className="text-3xl font-bold">£2.50<span className="text-lg text-gray-500">/seat/month</span></div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Growing businesses (5-50 seats)</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold">£2<span className="text-lg text-gray-500">/seat/month</span></div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Large organizations (25+ seats)</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8">
            <Link href="/business-registration">
              <Button size="lg" className="px-8 py-3">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <p>&copy; 2025 ShiftFlo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}