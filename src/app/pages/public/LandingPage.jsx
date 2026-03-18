import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Monitor, Wrench, TrendingUp, Sparkles, Shield, Users, MessageSquare, Clock, CheckCircle, ArrowRight, Mail, Phone, MapPin, Paintbrush, Laptop, Menu, X, } from 'lucide-react';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { BubbleBackgroundDemo } from '../../components/backgrounds/BubbleBackgroundDemo';
export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    const sections = ['how-it-works', 'services', 'costestimation', 'about', 'contactus'];
    
    
    if (window.scrollY < 300) {
      setActiveSection(''); 
      return;
    }


    const scrollPosition = window.scrollY + 200; 

    const isBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 80;

    if (isBottom) {
      setActiveSection('contactus');
    } else {
      sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
          }
        }
      });
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
  const revealElements = document.querySelectorAll('[data-reveal]');
  if (!revealElements.length) return;

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const delay = entry.target.getAttribute('data-reveal-delay');
        if (delay) {
          entry.target.style.transitionDelay = `${delay}ms`;
        }

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px',
    },
  );

  revealElements.forEach((element) => observer.observe(element));

  return () => observer.disconnect();
}, []);
    const navLinks = [
      { id: 'how-it-works', label: 'How works' },
      { id: 'services', label: 'Categories' },
      { id: 'costestimation', label: 'AI Estimation' },
      { id: 'about', label: 'About us' },
    ];
    const services = [
        {
            title: 'IT Support',
            icon: Monitor,
            image: 'https://images.unsplash.com/photo-1768633647910-7e6fb53e5b0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdCUyMHN1cHBvcnQlMjBtYWludGVuYW5jZXxlbnwxfHx8fDE3NzI2Njg0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Maintenance',
            icon: Wrench,
            image: 'https://images.unsplash.com/photo-1744302448007-4c9b5cc5cba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjByZXBhaXIlMjB0ZWNobmljaWFufGVufDF8fHx8MTc3MjY2ODQ0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Marketing',
            icon: TrendingUp,
            image: 'https://images.unsplash.com/photo-1726594699522-d7c2f5459f52?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXRpbmclMjBjcmVhdGl2ZSUyMGFnZW5jeXxlbnwxfHx8fDE3NzI2Njg0NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Cleaning',
            icon: Sparkles,
            image: 'https://images.unsplash.com/photo-1760611656615-db3fad24a314?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc3MjY2MTEzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Security',
            icon: Shield,
            image: 'https://images.unsplash.com/photo-1764173038831-3ef384e6321e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMGd1YXJkJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MjY2MDM3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Consulting',
            icon: Users,
            image: 'https://images.unsplash.com/photo-1765020553734-2c050ddb9494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdWx0aW5nJTIwYnVzaW5lc3MlMjBtZWV0aW5nfGVufDF8fHx8MTc3MjU3MjYzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Design',
            icon: Paintbrush,
            image: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MjY2ODQ0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
        {
            title: 'Device Maintenance',
            icon: Laptop,
            image: 'https://images.unsplash.com/photo-1744302448007-4c9b5cc5cba8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjByZXBhaXIlMjB0ZWNobmljaWFufGVufDF8fHx8MTc3MjY2ODQ0NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        },
    ];
    return (<div className="min-h-screen bg-white">
      <style>
        {`
          .reveal-item {
            opacity: 0;
            transform: translateY(34px);
            transition: opacity 700ms ease, transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
            will-change: opacity, transform;
          }

          .reveal-item.is-visible {
            opacity: 1;
            transform: translateY(0);
          }

          @media (prefers-reduced-motion: reduce) {
            .reveal-item,
            .reveal-item.is-visible {
              opacity: 1;
              transform: none;
              transition: none;
            }
          }
        `}
      </style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6f74ea] rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">CS</span>
            </div>
            <h1 className="text-2xl font-bold text-black">CorpServe</h1>
          </div>

          <div className="hidden items-center gap-3 sm:gap-5 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-sm font-semibold capitalize transition-colors sm:text-base ${
                  activeSection === item.id ? 'text-[#6f74ea]' : 'text-slate-700 hover:text-[#6f74ea]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 px-6 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                    activeSection === item.id
                      ? 'bg-[#6f74ea]/10 text-[#6f74ea]'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#6f74ea]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] overflow-hidden py-16 bg-white">
        <div className="absolute inset-0 h-full w-full">
          <BubbleBackgroundDemo interactive={true} />
        </div>

        <div className="relative z-10 mx-auto max-w-[88rem] px-7 pt-3 sm:pt-8 lg:pt-10">
          <div className="grid gap-12 items-center lg:grid-cols-2">
            <div className="reveal-item mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-3xl lg:text-left" data-reveal data-reveal-delay="40">
              <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Connect with Verified Service Providers
              </h2>
              <p className="mx-auto mb-8 text-lg font-medium text-fuchsia-50 sm:text-xl lg:mx-0 lg:max-w-2xl">
                CorpServe is a B2B platform that connects companies with verified vendors to manage services, SLAs, and payments.

              </p>
              <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="gap-2 bg-[#6f74ea] text-white hover:bg-indigo-300 hover:text-gray-900"
                  >
                    Get Started <ArrowRight className="w-4 h-4"/>
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
            <div className="reveal-item mx-auto w-full max-w-md lg:max-w-xl" data-reveal data-reveal-delay="120">
              <div className="overflow-hidden rounded-lg border border-white/15 bg-black/20 shadow-2xl shadow-black/35 backdrop-blur-[1px]">
                <ImageWithFallback
                  src="/mike-kononov-lFv0V3_2H6s-unsplash.jpg"
                  alt="Corporate office at night"
                  className="h-[320px] w-full object-cover sm:h-[360px] lg:h-[400px]"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item text-center mb-16" data-reveal>
            <h3 className="text-4xl font-bold text-indigo-500 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600">Simple, efficient, and transparent process</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="reveal-item border-2 border-blue-200" data-reveal data-reveal-delay="0">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600"/>
                </div>
                <CardTitle>1. Post Your Request</CardTitle>
                <CardDescription>
                  Describe your service needs and get AI-powered cost and time estimates instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal-item border-2 border-green-200" data-reveal data-reveal-delay="90">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-green-600"/>
                </div>
                <CardTitle>2. Receive Proposals</CardTitle>
                <CardDescription>
                  Verified vendors submit proposals. Review, negotiate, and accept the best offer.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal-item border-2 border-purple-200" data-reveal data-reveal-delay="180">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-purple-600"/>
                </div>
                <CardTitle>3. Track & Complete</CardTitle>
                <CardDescription>
                  Monitor progress with SLA tracking, communicate via chat, and pay securely upon
                  completion.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Categories */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item text-center mb-16" data-reveal>
            <h3 className="text-4xl font-bold text-indigo-500 mb-4">Service Categories</h3>
            <p className="text-xl text-gray-600">
              Wide range of enterprise services from verified vendors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service) => {
            const Icon = service.icon;
            return (<Card key={service.title} className="reveal-item group cursor-pointer overflow-hidden border border-indigo-100/80 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_22px_44px_rgba(139,92,246,0.34)]" data-reveal data-reveal-delay="60">
                  <CardContent className="p-0">
                    <div className="relative h-32 overflow-hidden rounded-t-lg">
                      <ImageWithFallback src={service.image} alt={service.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>
                      <div className="absolute bottom-3 left-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 shadow-md ring-1 ring-indigo-100">
                          <Icon className="h-5 w-5 text-[#6f74ea]"/>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">{service.title}</h4>
                      <p className="mt-1 text-xs font-medium text-slate-500">Verified enterprise vendors</p>
                    </div>
                  </CardContent>
                </Card>);
        })}
          </div>
        </div>
      </section>

      {/* AI Cost Estimation Highlight */}
      <section id="costestimation" className="py-20 bg-[#3a419b]">
        <div className="reveal-item max-w-7xl mx-auto px-6" data-reveal>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <ImageWithFallback src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGFuYWx5dGljcyUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NzI1OTkxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="AI Analytics" className="rounded-2xl shadow-2xl w-full"/>
            </div>
            <div className="text-white">
              <h3 className="text-4xl font-bold mb-6">AI-Powered Cost Estimation</h3>
              <p className="text-xl mb-8 text-blue-100">
                Get instant, accurate cost and time estimates for your service requests using our
                advanced AI algorithms. Make informed decisions with data-driven insights.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1 text-green-400"/>
                  <span className="text-lg">Instant cost predictions based on historical data</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1 text-green-400"/>
                  <span className="text-lg">Accurate time estimates for project planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1 text-green-400"/>
                  <span className="text-lg">Budget optimization recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-violet-50/70 p-8 shadow-xl shadow-indigo-100/60 lg:p-12" data-reveal>
            <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-violet-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-indigo-200/40 blur-3xl" />

            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex rounded-full border border-indigo-300 bg-white/80 px-4 py-1 text-sm font-semibold text-[#6f74ea]">
                  About CorpServe
                </span>
                <h3 className="mt-4 text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">
                  Built for modern teams that need trusted services fast.
                </h3>
                <p className="mt-5 max-w-2xl text-lg text-slate-600 lg:text-xl">
                  CorpServe is a comprehensive B2B Enterprise Service Management System designed to
                  streamline how companies connect with verified service providers. We bring
                  transparency, speed, and quality into every business transaction.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900">24/7</p>
                    <p className="text-sm font-medium text-slate-500">Request tracking</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                    <p className="text-2xl font-black text-slate-900">SLA</p>
                    <p className="text-sm font-medium text-slate-500">Driven workflows</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-2xl font-black text-slate-900">Secure</p>
                    <p className="text-sm font-medium text-slate-500">Payments & records</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-2xl border border-white/80 bg-indigo-100/60 shadow-xl shadow-indigo-200/50">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1696861273647-92dfe8bb697c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBzZXJ2aWNlcyUyMGhhbmRzaGFrZXxlbnwxfHx8fDE3NzI2Njg0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Professional handshake"
                    className="h-[320px] w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-[380px]"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700">
                    <Shield className="h-4 w-4 text-[#6f74ea]" />
                    Verified Network
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-[#6f74ea]" />
                    B2B Focused
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contactus" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item grid md:grid-cols-3 gap-8 mb-8" data-reveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#6f74ea] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">CS</span>
                </div>
                <h4 className="text-xl font-bold text-white">CorpServe</h4>
              </div>
              <p className="text-gray-400">
                Your trusted B2B Enterprise Service Management System
              </p>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/signup" className="hover:text-white transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Contact Info</h5>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start gap-2">
                  <Mail className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                  <span>contact@corpserve.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                  <span>123 Business Ave, Suite 100, NY 10001</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="reveal-item border-t border-gray-800 pt-8 text-center text-gray-400" data-reveal data-reveal-delay="60">
            <p>&copy; 2026 CorpServe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);
}
