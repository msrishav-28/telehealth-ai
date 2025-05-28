'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';
import { 
  Brain, 
  Heart, 
  Shield, 
  Sparkles, 
  Users, 
  Zap,
  ChevronDown,
  Check,
  Star,
  Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GradientOrbs } from '@/components/animations/GradientOrbs';
import { ParticleField } from '@/components/animations/ParticleField';
import { FloatingCards } from '@/components/animations/FloatingCards';

const personas = [
  {
    id: 'psychiatrist',
    name: 'Psychiatrist',
    icon: Brain,
    description: 'Mental health support and guidance',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'allergist',
    name: 'Allergist',
    icon: Shield,
    description: 'Allergy and immunology expertise',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'geriatrician',
    name: 'Geriatrician',
    icon: Heart,
    description: 'Specialized care for older adults',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'psychologist',
    name: 'Psychologist',
    icon: Sparkles,
    description: 'Behavioral and emotional wellness',
    color: 'from-green-500 to-emerald-500',
  },
];

const features = [
  {
    title: 'AI-Powered Consultations',
    description: 'Get instant responses from specialized AI personas trained on medical knowledge',
    icon: Zap,
  },
  {
    title: 'Evidence-Based Information',
    description: 'All responses include citations from trusted medical sources via Perplexity AI',
    icon: Shield,
  },
  {
    title: 'Multi-Specialist Support',
    description: 'Access different medical specialties based on your specific needs',
    icon: Users,
  },
  {
    title: 'Privacy First',
    description: 'Your conversations are encrypted and never shared without your consent',
    icon: Shield,
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Patient',
    content: 'The AI psychiatrist helped me understand my anxiety better. The citations gave me confidence in the information.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Caregiver',
    content: 'As a caregiver for my elderly parent, the geriatrician AI has been invaluable for quick guidance.',
    rating: 5,
  },
  {
    name: 'Emily Davis',
    role: 'Parent',
    content: 'The allergist AI helped me identify potential triggers for my child\'s reactions. So helpful!',
    rating: 5,
  },
];

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background/95 to-background">
      {/* Background Animations */}
      <div className="fixed inset-0 -z-10">
        <GradientOrbs />
        <ParticleField />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-red-500" />
            <span className="text-xl font-bold">TeleHealth AI</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <Link href="/dashboard">
                <Button variant="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="default" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Get Started Free
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          style={{ y, opacity }}
          className="text-center space-y-8 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Your AI Health Companion
              </span>
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Get instant, personalized medical guidance from AI specialists powered by trusted sources
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <SignUpButton mode="modal">
              <Button size="lg" className="gap-2 group">
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Start Free Consultation
              </Button>
            </SignUpButton>
            <Link href="#demo">
              <Button size="lg" variant="outline" className="gap-2">
                Watch Demo
                <ChevronDown className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          {/* Floating Persona Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative h-64 mt-16"
          >
            <FloatingCards personas={personas} />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose TeleHealth AI?
            </h2>
            <p className="text-xl text-muted-foreground">
              Advanced features designed for your health journey
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                  <feature.icon className="h-12 w-12 mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands who trust TeleHealth AI for their health questions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-muted-foreground/20 mb-2" />
                  <p className="text-lg mb-4">{testimonial.content}</p>
                  <div className="mt-auto">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center"
        >
          <Card className="p-12 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 border-2">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Health Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands getting personalized health guidance from AI specialists
            </p>
            <SignUpButton mode="modal">
              <Button size="lg" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Get Started Free - No Credit Card Required
              </Button>
            </SignUpButton>
            <p className="mt-4 text-sm text-muted-foreground">
              ✓ Free forever plan • ✓ No credit card required • ✓ Cancel anytime
            </p>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold">TeleHealth AI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered health guidance from trusted sources
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/demo">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/disclaimer">Medical Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 TeleHealth AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}