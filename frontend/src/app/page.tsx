'use client';

import Link from 'next/link';
import { Shield, AlertTriangle, Users, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-cyan-400 mr-3" />
              <h1 className="text-2xl font-bold text-white">Secura</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/auth/register" className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-md font-medium transition-colors">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Enterprise Security
            <span className="text-cyan-400"> Incident Management</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Real-time incident reporting, AI-powered categorization, and secure team collaboration. 
            Protect your organization with intelligent security management.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register" className="bg-cyan-500 hover:bg-cyan-600 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              Start Free Trial
            </Link>
            <Link href="/auth/login" className="border border-gray-600 hover:border-gray-500 px-8 py-3 rounded-lg font-semibold text-lg transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <AlertTriangle className="h-12 w-12 text-cyan-400 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Smart Reporting</h4>
              <p className="text-gray-300">AI-powered incident categorization with real-time severity assessment</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <Users className="h-12 w-12 text-cyan-400 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Team Collaboration</h4>
              <p className="text-gray-300">Secure messaging and real-time updates between security teams</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <BarChart3 className="h-12 w-12 text-cyan-400 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Advanced Analytics</h4>
              <p className="text-gray-300">Executive dashboards with predictive threat intelligence</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <Shield className="h-12 w-12 text-cyan-400 mb-4" />
              <h4 className="text-xl font-semibold mb-2">Enterprise Security</h4>
              <p className="text-gray-300">Role-based access, encryption, and compliance reporting</p>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="py-20">
          <h3 className="text-3xl font-bold text-center mb-12">Built for Every Role</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">👤</div>
              <h4 className="text-xl font-semibold mb-2 text-cyan-400">EMPLOYEE</h4>
              <p className="text-gray-300 mb-4">&quot;Report incidents easily&quot;</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Submit security incident reports</li>
                <li>Upload evidence files</li>
                <li>Track incident status</li>
                <li>Offline reporting capability</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h4 className="text-xl font-semibold mb-2 text-cyan-400">SECURITY TEAM</h4>
              <p className="text-gray-300 mb-4">&quot;Investigate and resolve incidents&quot;</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>View all organization incidents</li>
                <li>Use AI analysis tools</li>
                <li>Assign priority levels</li>
                <li>Track investigation progress</li>
              </ul>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔑</div>
              <h4 className="text-xl font-semibold mb-2 text-cyan-400">ADMIN</h4>
              <p className="text-gray-300 mb-4">&quot;Manage system and users&quot;</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>Add/remove security team members</li>
                <li>Configure system settings</li>
                <li>View executive dashboards</li>
                <li>Generate compliance reports</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-cyan-400 mr-2" />
              <span className="text-gray-400">© 2024 Secura. All rights reserved.</span>
            </div>
            <div className="text-gray-400">
              Enterprise Security Solutions
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}