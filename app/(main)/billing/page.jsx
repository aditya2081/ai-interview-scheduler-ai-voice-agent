"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Download, Calendar } from "lucide-react";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("pro");

  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: "$29",
      period: "/month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 50 interviews per month",
        "Basic AI feedback",
        "Email notifications",
        "Standard support"
      ],
      buttonText: currentPlan === "basic" ? "Current Plan" : "Downgrade",
      isPopular: false
    },
    {
      id: "pro",
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "Best for growing teams and businesses",
      features: [
        "Up to 200 interviews per month",
        "Advanced AI feedback & analytics",
        "Custom branding",
        "Priority support",
        "Candidate photo capture",
        "Advanced reporting"
      ],
      buttonText: currentPlan === "pro" ? "Current Plan" : "Upgrade",
      isPopular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited interviews",
        "Custom AI models",
        "White-label solution",
        "Dedicated support",
        "API access",
        "SSO integration",
        "Custom integrations"
      ],
      buttonText: currentPlan === "enterprise" ? "Current Plan" : "Contact Sales",
      isPopular: false
    }
  ];

  const billingHistory = [
    {
      id: 1,
      date: "Oct 1, 2025",
      description: "Professional Plan - Monthly",
      amount: "$79.00",
      status: "Paid",
      invoice: "INV-001234"
    },
    {
      id: 2,
      date: "Sep 1, 2025",
      description: "Professional Plan - Monthly",
      amount: "$79.00",
      status: "Paid",
      invoice: "INV-001233"
    },
    {
      id: 3,
      date: "Aug 1, 2025",
      description: "Professional Plan - Monthly",
      amount: "$79.00",
      status: "Paid",
      invoice: "INV-001232"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Overview */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Professional Plan</h3>
              <p className="text-gray-600">$79/month • Next billing date: Nov 1, 2025</p>
            </div>
            <div className="text-right">
              <Button variant="outline" className="mr-2">
                <CreditCard className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Change Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.isPopular ? 'border-blue-500 shadow-lg' : ''}`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={currentPlan === plan.id ? "secondary" : "default"}
                  disabled={currentPlan === plan.id}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your previous invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{item.date}</td>
                    <td className="py-3 px-4">{item.description}</td>
                    <td className="py-3 px-4 font-medium">{item.amount}</td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        {item.invoice}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Usage Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>Your usage for this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">127</div>
              <div className="text-sm text-gray-600">Interviews Conducted</div>
              <div className="text-xs text-gray-500">out of 200 included</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">89%</div>
              <div className="text-sm text-gray-600">AI Accuracy Rate</div>
              <div className="text-xs text-gray-500">above average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">23</div>
              <div className="text-sm text-gray-600">Days Remaining</div>
              <div className="text-xs text-gray-500">in current cycle</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}