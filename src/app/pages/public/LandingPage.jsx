import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Monitor, Wrench, TrendingUp, Sparkles, Shield, Users, MessageSquare, Clock, CheckCircle, ArrowRight, Mail, Phone, MapPin, Paintbrush, Laptop, Menu, X, Zap, } from 'lucide-react';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import FloatingLines from '../../../components/FloatingLines';
import ThemeToggleButton from '../../components/ThemeToggleButton';
export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const howItWorksRef = useRef(null);
  const servicesRef = useRef(null);
  const aboutRef = useRef(null);

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

useEffect(() => {
  let rafId = 0;

  const updateSectionProgress = () => {
    const refs = [howItWorksRef, servicesRef, aboutRef];
    const viewportHeight = window.innerHeight || 1;

    refs.forEach((sectionRef) => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const start = viewportHeight * 0.9;
      const end = -rect.height * 0.3;
      const rawProgress = (start - rect.top) / (start - end);
      const clamped = Math.min(1, Math.max(0, rawProgress));
      section.style.setProperty('--scroll-progress', clamped.toFixed(4));
    });

    rafId = 0;
  };

  const onScrollOrResize = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(updateSectionProgress);
  };

  updateSectionProgress();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize);

  return () => {
    window.removeEventListener('scroll', onScrollOrResize);
    window.removeEventListener('resize', onScrollOrResize);
    if (rafId) window.cancelAnimationFrame(rafId);
  };
}, []);
    const navLinks = [
      { id: 'how-it-works', label: 'How It Works' },
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
    const serviceAccentStyles = [
      {
        card: 'border-blue-200/80 hover:border-blue-300 dark:border-blue-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-blue-950/35 dark:hover:border-blue-400',
        iconWrap: 'ring-blue-200 dark:border-blue-400/35 dark:bg-blue-500/20 dark:ring-blue-400/30',
        icon: 'text-blue-600 dark:text-blue-200',
      },
      {
        card: 'border-emerald-200/80 hover:border-emerald-300 dark:border-emerald-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-emerald-950/30 dark:hover:border-emerald-400',
        iconWrap: 'ring-emerald-200 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:ring-emerald-400/30',
        icon: 'text-emerald-600 dark:text-emerald-200',
      },
      {
        card: 'border-violet-200/80 hover:border-violet-300 dark:border-violet-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-violet-950/34 dark:hover:border-violet-400',
        iconWrap: 'ring-violet-200 dark:border-violet-400/35 dark:bg-violet-500/20 dark:ring-violet-400/30',
        icon: 'text-violet-600 dark:text-violet-200',
      },
      {
        card: 'border-fuchsia-200/80 hover:border-fuchsia-300 dark:border-fuchsia-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-fuchsia-950/34 dark:hover:border-fuchsia-400',
        iconWrap: 'ring-fuchsia-200 dark:border-fuchsia-400/35 dark:bg-fuchsia-500/20 dark:ring-fuchsia-400/30',
        icon: 'text-fuchsia-600 dark:text-fuchsia-200',
      },
      {
        card: 'border-amber-200/80 hover:border-amber-300 dark:border-amber-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-amber-950/30 dark:hover:border-amber-400',
        iconWrap: 'ring-amber-200 dark:border-amber-400/35 dark:bg-amber-500/20 dark:ring-amber-400/30',
        icon: 'text-amber-600 dark:text-amber-200',
      },
      {
        card: 'border-cyan-200/80 hover:border-cyan-300 dark:border-cyan-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-cyan-950/30 dark:hover:border-cyan-400',
        iconWrap: 'ring-cyan-200 dark:border-cyan-400/35 dark:bg-cyan-500/20 dark:ring-cyan-400/30',
        icon: 'text-cyan-600 dark:text-cyan-200',
      },
      {
        card: 'border-rose-200/80 hover:border-rose-300 dark:border-rose-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-rose-950/30 dark:hover:border-rose-400',
        iconWrap: 'ring-rose-200 dark:border-rose-400/35 dark:bg-rose-500/20 dark:ring-rose-400/30',
        icon: 'text-rose-600 dark:text-rose-200',
      },
      {
        card: 'border-indigo-200/80 hover:border-indigo-300 dark:border-indigo-500/35 dark:bg-gradient-to-b dark:from-slate-900 dark:to-indigo-950/35 dark:hover:border-indigo-400',
        iconWrap: 'ring-indigo-200 dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:ring-indigo-400/30',
        icon: 'text-indigo-600 dark:text-indigo-200',
      },
    ];
    return (<div className="min-h-screen bg-white dark:bg-slate-950">
      <style>
        {`
          .section-scroll-anim {
            --scroll-progress: 0;
          }

          .section-scroll-anim .scroll-heading {
            transform: translate3d(0, calc((1 - var(--scroll-progress)) * 24px), 0) scale(calc(0.97 + var(--scroll-progress) * 0.03));
            opacity: calc(0.45 + var(--scroll-progress) * 0.55);
            transition: transform 120ms linear, opacity 120ms linear;
            will-change: transform, opacity;
          }

          .section-scroll-anim .scroll-subheading {
            transform: translate3d(0, calc((1 - var(--scroll-progress)) * 18px), 0);
            opacity: calc(0.5 + var(--scroll-progress) * 0.5);
            transition: transform 120ms linear, opacity 120ms linear;
            will-change: transform, opacity;
          }

          .section-scroll-anim .scroll-grid-stagger > * {
            transform: translate3d(0, calc((1 - var(--scroll-progress)) * (14px + var(--card-index, 0) * 8px)), 0);
            transition: transform 140ms linear;
            will-change: transform;
          }

          .section-scroll-anim .scroll-about-panel {
            transform: translate3d(0, calc((1 - var(--scroll-progress)) * 28px), 0) scale(calc(0.985 + var(--scroll-progress) * 0.015));
            transition: transform 140ms linear;
            will-change: transform;
          }

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

          .hero-float {
            animation: heroFloat 7s ease-in-out infinite;
          }

          .hero-float-slow {
            animation-duration: 9s;
          }

          .hero-float-fast {
            animation-duration: 5.6s;
          }

          @keyframes heroFloat {
            0%,
            100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-14px);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .reveal-item,
            .reveal-item.is-visible {
              opacity: 1;
              transform: none;
              transition: none;
            }

            .hero-float,
            .hero-float-slow,
            .hero-float-fast {
              animation: none;
            }
          }
        `}
      </style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-indigo-500/30 dark:bg-gradient-to-r dark:from-[#111a33]/95 dark:to-[#1a2545]/95 dark:shadow-[0_10px_26px_rgba(2,6,23,0.45)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="Go to home"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] shadow-[0_8px_20px_rgba(111,116,234,0.35)] transition-transform hover:scale-105"
            >
              <span className="text-sm font-bold text-white">CS</span>
            </a>
            <h1 className="text-2xl font-bold text-black dark:text-white">CorpServe</h1>
          </div>

          <div className="hidden items-center gap-3 sm:gap-5 md:flex">
            {navLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`text-sm font-semibold capitalize transition-colors sm:text-base ${
                  activeSection === item.id ? 'text-[#6f74ea] dark:text-indigo-300' : 'text-slate-700 hover:text-[#6f74ea] dark:text-slate-200 dark:hover:text-indigo-300'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton className="h-10 w-10 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" />

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-700 md:hidden"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 px-6 py-3 dark:border-slate-700 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                    activeSection === item.id
                      ? 'bg-[#6f74ea]/10 text-[#6f74ea] dark:bg-indigo-500/20 dark:text-indigo-200'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#6f74ea] dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-indigo-300'
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
      <section className="relative min-h-[80vh] overflow-hidden bg-white">
        <div className="absolute inset-0 h-full w-full">
          <FloatingLines
            enabledWaves={['middle', 'top', 'bottom']}
            lineCount={7}
            lineDistance={17}
            bendRadius={8.5}
            bendStrength={-1.5}
            interactive={true}
            parallax={true}
            mixBlendMode="normal"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/50" />

        <div className="relative z-10 mx-auto max-w-[88rem] px-7 py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:-mt-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div className="reveal-item mx-auto max-w-3xl text-center lg:mx-0 lg:text-left" data-reveal data-reveal-delay="40">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/15 px-4 py-2 text-sm font-semibold text-violet-100">
                <Sparkles className="h-4 w-4" />
                Trusted by 500+ Companies
              </div>

              <h2 className="mb-5 text-4xl font-bold leading-tight text-white [text-shadow:0_6px_26px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-6xl">
                Connect with
                {' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text px-1 tracking-[0.08em] text-transparent">
                  Verified
                </span>
                <br />
                Service Providers
              </h2>

              <p className="mx-auto mb-6 max-w-2xl text-xl font-medium text-slate-100 [text-shadow:0_2px_18px_rgba(0,0,0,0.7)] lg:mx-0">
                CorpServe is a B2B platform that connects companies with verified vendors to manage services, SLAs, and payments.
              </p>

              <div className="mb-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm"><Shield className="h-4 w-4 text-cyan-300" />Verified Vendors</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm"><CheckCircle className="h-4 w-4 text-violet-300" />SLA Management</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm"><Clock className="h-4 w-4 text-pink-300" />Real-time Tracking</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-slate-100 backdrop-blur-sm"><TrendingUp className="h-4 w-4 text-cyan-300" />Analytics</span>
              </div>

              <div className="flex w-full flex-wrap items-center justify-center gap-4 lg:justify-start">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="gap-2 bg-[#6f74ea] text-white hover:bg-indigo-300 hover:text-gray-900"
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/80 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden min-h-[430px] lg:block">
              <div className="hero-float absolute left-[8%] top-[8%] rounded-[28px] border border-violet-200/35 bg-gradient-to-br from-violet-200/25 via-white/8 to-violet-300/10 p-5 text-violet-100 shadow-[0_18px_48px_rgba(124,58,237,0.32)] backdrop-blur-md">
                <Shield className="h-10 w-10 drop-shadow-[0_0_14px_rgba(196,181,253,0.75)]" />
              </div>
              <div className="hero-float hero-float-slow absolute right-[8%] top-[28%] rounded-[28px] border border-fuchsia-200/35 bg-gradient-to-br from-fuchsia-200/25 via-white/8 to-fuchsia-300/10 p-5 text-fuchsia-100 shadow-[0_18px_48px_rgba(217,70,239,0.3)] backdrop-blur-md">
                <Zap className="h-10 w-10 drop-shadow-[0_0_14px_rgba(250,232,255,0.75)]" />
              </div>
              <div className="hero-float hero-float-fast absolute right-[16%] bottom-[12%] rounded-[28px] border border-cyan-200/35 bg-gradient-to-br from-cyan-200/25 via-white/8 to-cyan-300/10 p-5 text-cyan-100 shadow-[0_18px_48px_rgba(34,211,238,0.3)] backdrop-blur-md">
                <Users className="h-10 w-10 drop-shadow-[0_0_14px_rgba(207,250,254,0.75)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksRef} id="how-it-works" className="section-scroll-anim relative overflow-hidden py-20 bg-[linear-gradient(160deg,#f8f9ff_0%,#f3f6ff_42%,#ffffff_100%)] dark:bg-[linear-gradient(160deg,#0b1220_0%,#0f172a_48%,#111827_100%)]">
        <div className="pointer-events-none absolute -left-12 top-8 h-56 w-56 rounded-full bg-violet-300/35 blur-3xl dark:bg-violet-600/25" />
        <div className="pointer-events-none absolute -right-12 bottom-2 h-52 w-52 rounded-full bg-pink-300/25 blur-3xl dark:bg-fuchsia-600/20" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="reveal-item mb-10 text-center" data-reveal>
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-white px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:border-violet-400/35 dark:bg-slate-900/70 dark:text-violet-200">
              Workflow
            </span>
            <h3 className="scroll-heading mt-4 bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:bg-none dark:text-white sm:text-4xl lg:text-5xl">
              How It Works
            </h3>
            <p className="scroll-subheading mx-auto mt-3 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              Simple, efficient, and transparent process
            </p>
          </div>

          <div className="scroll-grid-stagger grid gap-5 md:grid-cols-3">
            <Card style={{ '--card-index': 0 }} className="reveal-item group relative overflow-hidden rounded-[24px] border border-blue-200/80 bg-white/90 shadow-[0_12px_28px_rgba(37,99,235,0.14)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-blue-300 hover:shadow-[0_26px_56px_rgba(37,99,235,0.24)] dark:border-blue-500/35 dark:bg-slate-900/88 dark:shadow-[0_24px_52px_rgba(2,6,23,0.65)] dark:hover:border-blue-400 dark:hover:shadow-[0_28px_60px_rgba(37,99,235,0.22)]" data-reveal data-reveal-delay="0">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle_at_top_right,rgba(147,197,253,0.22),transparent_58%)]" />
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-blue-200/80 bg-blue-50/90 text-xs font-bold text-blue-600 dark:border-blue-400/35 dark:bg-blue-500/20 dark:text-blue-200">01</div>
              <CardHeader className="relative z-10 pb-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 dark:border dark:border-blue-400/35 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-400/30">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">INTAKE</span>
                </div>
                <CardTitle className="text-[1.65rem] font-bold tracking-tight text-slate-900 dark:text-slate-100">Post Your Request</CardTitle>
                <CardDescription className="mt-2 text-[1.05rem] leading-relaxed text-slate-600 dark:text-slate-300">
                  Describe your service needs and get AI-powered cost and time estimates instantly.
                </CardDescription>
              </CardHeader>
              <div className="mx-6 mb-5 h-1 rounded-full bg-gradient-to-r from-blue-500/80 to-indigo-500/80" />
            </Card>

            <Card style={{ '--card-index': 1 }} className="reveal-item group relative overflow-hidden rounded-[24px] border border-emerald-200/80 bg-white/90 shadow-[0_12px_28px_rgba(5,150,105,0.14)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300 hover:shadow-[0_26px_56px_rgba(5,150,105,0.24)] dark:border-emerald-500/35 dark:bg-slate-900/88 dark:shadow-[0_24px_52px_rgba(2,6,23,0.65)] dark:hover:border-emerald-400 dark:hover:shadow-[0_28px_60px_rgba(5,150,105,0.22)]" data-reveal data-reveal-delay="90">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle_at_top_right,rgba(110,231,183,0.24),transparent_58%)]" />
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50/90 text-xs font-bold text-emerald-600 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200">02</div>
              <CardHeader className="relative z-10 pb-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 dark:border dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30">
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">SELECTION</span>
                </div>
                <CardTitle className="text-[1.65rem] font-bold tracking-tight text-slate-900 dark:text-slate-100">Receive Proposals</CardTitle>
                <CardDescription className="mt-2 text-[1.05rem] leading-relaxed text-slate-600 dark:text-slate-300">
                  Verified vendors submit proposals. Review, negotiate, and accept the best offer.
                </CardDescription>
              </CardHeader>
              <div className="mx-6 mb-5 h-1 rounded-full bg-gradient-to-r from-emerald-500/80 to-teal-500/80" />
            </Card>

            <Card style={{ '--card-index': 2 }} className="reveal-item group relative overflow-hidden rounded-[24px] border border-violet-200/80 bg-white/90 shadow-[0_12px_28px_rgba(124,58,237,0.14)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-violet-300 hover:shadow-[0_26px_56px_rgba(124,58,237,0.24)] dark:border-violet-500/35 dark:bg-slate-900/88 dark:shadow-[0_24px_52px_rgba(2,6,23,0.65)] dark:hover:border-violet-400 dark:hover:shadow-[0_28px_60px_rgba(124,58,237,0.22)]" data-reveal data-reveal-delay="180">
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle_at_top_right,rgba(196,181,253,0.22),transparent_58%)]" />
              <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/80 bg-violet-50/90 text-xs font-bold text-violet-600 dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-200">03</div>
              <CardHeader className="relative z-10 pb-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-200 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 dark:border dark:border-violet-400/35 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-400/30">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold tracking-[0.14em] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">DELIVERY</span>
                </div>
                <CardTitle className="text-[1.65rem] font-bold tracking-tight text-slate-900 dark:text-slate-100">Track & Complete</CardTitle>
                <CardDescription className="mt-2 text-[1.05rem] leading-relaxed text-slate-600 dark:text-slate-300">
                  Monitor progress with SLA tracking, communicate via chat, and pay securely upon completion.
                </CardDescription>
              </CardHeader>
              <div className="mx-6 mb-5 h-1 rounded-full bg-gradient-to-r from-violet-500/80 to-pink-500/80" />
            </Card>
          </div>
        </div>
      </section>

      {/* Services Categories */}
      <section ref={servicesRef} id="services" className="section-scroll-anim py-20 bg-gray-50 dark:bg-[linear-gradient(180deg,#0b1220_0%,#0f172a_100%)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item text-center mb-16" data-reveal>
            <h3 className="scroll-heading mb-4 bg-gradient-to-r from-violet-600 via-violet-500 to-pink-500 bg-clip-text text-4xl font-bold text-transparent dark:bg-none dark:text-white">
              Service Categories
            </h3>
            <p className="scroll-subheading text-xl text-gray-600 dark:text-slate-300">
              Wide range of enterprise services from verified vendors
            </p>
          </div>

          <div className="scroll-grid-stagger grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service, index) => {
            const Icon = service.icon;
            const accent = serviceAccentStyles[index % serviceAccentStyles.length];
            return (<Card key={service.title} style={{ '--card-index': index }} className={`reveal-item group cursor-pointer overflow-hidden border bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(139,92,246,0.34)] dark:shadow-[0_20px_44px_rgba(2,6,23,0.62)] ${accent.card}`} data-reveal data-reveal-delay="60">
                  <CardContent className="p-0">
                    <div className="relative h-32 overflow-hidden rounded-t-lg">
                      <ImageWithFallback src={service.image} alt={service.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent dark:from-black/75 dark:via-black/30"/>
                      <div className="absolute bottom-3 left-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-white/95 shadow-md ring-1 dark:bg-slate-900/90 ${accent.iconWrap}`}>
                          <Icon className={`h-5 w-5 ${accent.icon}`}/>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-indigo-100/70 p-4 dark:border-slate-700">
                      <h4 className="text-[15px] font-bold text-slate-900 tracking-tight dark:text-slate-100">{service.title}</h4>
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">Verified enterprise vendors</p>
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
      <section ref={aboutRef} id="about" className="section-scroll-anim py-20 bg-white dark:bg-[linear-gradient(180deg,#0f1730_0%,#121a33_100%)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="scroll-about-panel reveal-item relative overflow-hidden rounded-3xl border border-slate-300/90 bg-[linear-gradient(140deg,#d3dae6_0%,#c7d0df_44%,#bcc7d8_100%)] p-8 shadow-[0_20px_44px_rgba(71,85,105,0.24),0_10px_28px_rgba(100,116,139,0.16)] dark:border-indigo-400/25 dark:bg-gradient-to-br dark:from-[#1a2044] dark:via-[#253a66] dark:to-[#492563] dark:shadow-[0_24px_60px_rgba(2,6,23,0.62)] lg:p-12" data-reveal>
            <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-indigo-300/35 blur-3xl dark:bg-violet-600/25" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-sky-300/35 blur-3xl dark:bg-indigo-600/25" />
            <div className="pointer-events-none absolute right-[38%] top-[36%] h-40 w-40 rounded-full bg-slate-200/60 blur-3xl" />

            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <span className="inline-flex rounded-full border border-slate-300 bg-gradient-to-r from-slate-100 to-indigo-100 px-4 py-1 text-sm font-semibold text-indigo-700 dark:border-indigo-300/45 dark:bg-none dark:bg-slate-900/85 dark:text-indigo-100">
                  About CorpServe
                </span>
                <h3 className="mt-4 bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600 bg-clip-text text-4xl font-bold leading-tight text-transparent dark:bg-none dark:text-slate-100 lg:text-5xl">
                  Built for modern teams that need trusted services fast.
                </h3>
                <p className="mt-5 max-w-2xl text-lg text-slate-700 dark:text-slate-300 lg:text-xl">
                  CorpServe is a comprehensive B2B Enterprise Service Management System designed to
                  streamline how companies connect with verified service providers. We bring
                  transparency, speed, and quality into every business transaction.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-indigo-300 bg-gradient-to-br from-indigo-100/95 to-slate-100/90 p-4 shadow-[0_10px_20px_rgba(79,70,229,0.16)] dark:border-indigo-400/35 dark:bg-gradient-to-br dark:from-[#121d39] dark:to-[#21345f] dark:shadow-[0_14px_28px_rgba(2,6,23,0.5)]">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">24/7</p>
                    <p className="text-sm font-medium text-indigo-600/85 dark:text-indigo-200">Request tracking</p>
                  </div>
                  <div className="rounded-2xl border border-sky-300 bg-gradient-to-br from-sky-100/95 to-slate-100/90 p-4 shadow-[0_10px_20px_rgba(2,132,199,0.14)] dark:border-sky-400/35 dark:bg-gradient-to-br dark:from-[#11263a] dark:to-[#1b3f5b] dark:shadow-[0_14px_28px_rgba(2,6,23,0.5)]">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">SLA</p>
                    <p className="text-sm font-medium text-sky-700/90 dark:text-sky-200">Driven workflows</p>
                  </div>
                  <div className="rounded-2xl border border-violet-300 bg-gradient-to-br from-violet-100/95 to-slate-100/90 p-4 shadow-[0_10px_20px_rgba(124,58,237,0.14)] col-span-2 sm:col-span-1 dark:border-violet-400/35 dark:bg-gradient-to-br dark:from-[#201a44] dark:to-[#3a2b61] dark:shadow-[0_14px_28px_rgba(2,6,23,0.5)]">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">Secure</p>
                    <p className="text-sm font-medium text-violet-700/90 dark:text-violet-200">Payments & records</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-2xl border border-slate-300/90 bg-gradient-to-br from-slate-200/85 via-indigo-100/70 to-sky-100/70 shadow-xl shadow-slate-400/30 dark:border-indigo-400/25 dark:bg-gradient-to-br dark:from-[#121d36] dark:via-[#1d2b52] dark:to-[#16243f] dark:shadow-[0_20px_46px_rgba(2,6,23,0.58)]">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1696861273647-92dfe8bb697c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBzZXJ2aWNlcyUyMGhhbmRzaGFrZXxlbnwxfHx8fDE3NzI2Njg0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Professional handshake"
                    className="h-[320px] w-full object-cover transition-transform duration-500 hover:scale-105 sm:h-[380px]"
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_rgba(148,163,184,0.18)] dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:shadow-none">
                    <Shield className="h-4 w-4 text-indigo-600 dark:text-cyan-300" />
                    Verified Network
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_8px_18px_rgba(148,163,184,0.18)] dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-100 dark:shadow-none">
                    <Users className="h-4 w-4 text-sky-600 dark:text-violet-300" />
                    B2B Focused
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contactus" className="border-t border-violet-300/20 bg-gradient-to-b from-[#121f3d] to-[#080f1f] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="reveal-item grid md:grid-cols-3 gap-8 mb-8" data-reveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <a
                  href="/"
                  aria-label="Go to home"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6f74ea] shadow-[0_8px_20px_rgba(111,116,234,0.35)] transition-transform hover:scale-105"
                >
                  <span className="text-white text-xl font-bold">CS</span>
                </a>
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
