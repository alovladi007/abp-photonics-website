'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, Brain, FileImage, Users, Shield, BarChart3, Clock, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <span className="text-blue-600 dark:text-blue-300 font-semibold">Enterprise Medical Imaging</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            MediMetrics Enterprise
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            HIPAA-compliant medical image analysis platform with AI-powered diagnostics,
            designed for small to medium healthcare organizations.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/auth/signin" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
              <Shield className="h-4 w-4" />
              Sign In
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2">
              <Activity className="h-4 w-4" />
              View Demo
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <Brain className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-semibold">AI Analysis</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Advanced deep learning models for classification and segmentation
              with explainable AI (Grad-CAM).
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <FileImage className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-semibold">DICOM Support</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Full DICOM compatibility with integrated OHIF viewer and
              Orthanc PACS server.
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-semibold">HIPAA Compliant</h3>
            <p className="text-sm text-muted-foreground mt-2">
              End-to-end encryption, audit logging, and role-based access
              control for PHI protection.
            </p>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <BarChart3 className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-semibold">Real-time Analytics</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Comprehensive metrics and dashboards with Prometheus and
              Grafana integration.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">99.9%</div>
            <div className="text-muted-foreground">Uptime SLA</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">&lt;100ms</div>
            <div className="text-muted-foreground">API Response</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">256-bit</div>
            <div className="text-muted-foreground">AES Encryption</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">24/7</div>
            <div className="text-muted-foreground">Support</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 rounded-lg border bg-primary text-primary-foreground p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Ready to Transform Your Medical Imaging?</h2>
            <p className="text-primary-foreground/80 text-lg mt-2">
              Join healthcare organizations using MediMetrics for faster, more accurate diagnoses.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Link href="/auth/signup" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-background text-foreground hover:bg-background/90 h-10 px-4 py-2">
                Start Free Trial
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 h-10 px-4 py-2">
                Contact Sales
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/60">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}