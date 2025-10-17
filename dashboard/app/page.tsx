'use client'

import { Header } from '@/components/layout/header'
import { FileUpload } from '@/components/scan/file-upload'
import { Shield, Zap, Eye, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: 'Security Analysis',
      description: 'Detect vulnerabilities, exposed secrets, and security anti-patterns',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'group-hover:border-error/30'
    },
    {
      icon: Zap,
      title: 'AI Pattern Detection',
      description: 'Identify AI-generated code patterns and potential issues',
      color: 'text-brand-purple',
      bgColor: 'bg-brand-purple/10',
      borderColor: 'group-hover:border-brand-purple/30'
    },
    {
      icon: Eye,
      title: 'Code Quality',
      description: 'Analyze complexity, maintainability, and best practices',
      color: 'text-brand-teal',
      bgColor: 'bg-brand-teal/10',
      borderColor: 'group-hover:border-brand-teal/30'
    },
    {
      icon: TrendingUp,
      title: 'Trend Analysis',
      description: 'Track improvements and identify recurring issues over time',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'group-hover:border-success/30'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-brand-teal/5">
      <Header />

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <Badge variant="secondary" className="text-sm px-4 py-2 bg-brand-purple/10 text-brand-purple border-brand-purple/20">
            AI-Powered Code Analysis
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-brand-teal via-brand-purple to-brand-coral bg-clip-text text-transparent">
            Scan Smarter, Ship Faster
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Catch security issues and code quality problems before they reach production.
            Fast, intelligent, and developer-friendly.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-8">
            {[
              { label: 'Issue Types', value: '20+', color: 'text-brand-teal' },
              { label: 'Languages', value: 'JS/TS', color: 'text-brand-coral' },
              { label: 'Scan Time', value: '<2s', color: 'text-brand-purple' },
              { label: 'Open Source', value: '100%', color: 'text-success' }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center space-y-1">
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Upload Section */}
        <section className="space-y-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Start Your Scan
            </h2>
            <p className="text-muted-foreground text-lg">
              Upload your code files for instant AI-powered analysis
            </p>
          </div>
          <FileUpload />
        </section>

        {/* Features Grid */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Powerful Features</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to ensure code quality and security
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className={`group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border hover:border-primary/30 ${feature.borderColor}`}
                >
                  <CardHeader className="space-y-4">
                    <div className={`p-3 ${feature.bgColor} rounded-xl w-fit transition-transform group-hover:scale-110 duration-300`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="leading-relaxed">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground text-lg">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid gap-6">
            {[
              {
                step: '1',
                title: 'Upload Your Code',
                description: 'Drag and drop your JavaScript/TypeScript files or entire projects',
                color: 'from-brand-teal to-brand-teal/70'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our engine scans for security issues, code quality, and AI patterns',
                color: 'from-brand-purple to-brand-purple/70'
              },
              {
                step: '3',
                title: 'Review & Fix',
                description: 'Get detailed reports with actionable insights and suggested fixes',
                color: 'from-brand-coral to-brand-coral/70'
              }
            ].map((item) => (
              <Card key={item.step} className="hover:shadow-lg transition-all duration-300 border-border/50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white font-bold text-lg shadow-lg`}>
                      {item.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center space-y-6 py-12 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold">Ready to improve your code quality?</h2>
          <p className="text-muted-foreground text-lg">
            Upload your code now for instant AI-powered security and quality analysis.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors shadow-lg shadow-primary/20"
            >
              Get Started Free
            </button>
            <a
              href="https://github.com/jufjuf/vibescan#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 border border-border hover:bg-accent text-foreground rounded-lg font-semibold transition-colors"
            >
              View Documentation
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
