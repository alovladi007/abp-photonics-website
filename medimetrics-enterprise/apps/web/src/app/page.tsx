'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Brain, FileImage, Users, Shield, BarChart3, Clock, Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Enterprise Medical Imaging
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            MediMetrics Enterprise
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            HIPAA-compliant medical image analysis platform with AI-powered diagnostics,
            designed for small to medium healthcare organizations.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="gap-2">
                <Shield className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2">
                <Activity className="h-4 w-4" />
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced deep learning models for classification and segmentation
                with explainable AI (Grad-CAM).
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileImage className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>DICOM Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Full DICOM compatibility with integrated OHIF viewer and
                Orthanc PACS server.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>HIPAA Compliant</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                End-to-end encryption, audit logging, and role-based access
                control for PHI protection.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Real-time Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive metrics and dashboards with Prometheus and
                Grafana integration.
              </CardDescription>
            </CardContent>
          </Card>
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
        <Card className="mt-20 bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Transform Your Medical Imaging?</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg mt-2">
              Join healthcare organizations using MediMetrics for faster, more accurate diagnoses.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-primary-foreground/60">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}