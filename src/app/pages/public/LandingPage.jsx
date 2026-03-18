import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Monitor, Wrench, TrendingUp, Sparkles, Shield, Users, MessageSquare, Clock, CheckCircle, ArrowRight, Mail, Phone, MapPin, Paintbrush, Laptop, } from 'lucide-react';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('');

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
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">CS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CorpServe</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-br from-blue-50 to-white ">
       
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Connect with Verified Service Providers
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                CorpServe is your B2B Enterprise Service Management System that connects companies
                with verified vendors to manage corporate service requests, SLA contracts, and
                payments.
              </p>
              <div className="flex gap-4">
                <Link to="/signup">
                  <Button size="lg" className="gap-2">
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
            
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600">Simple, efficient, and transparent process</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
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

            <Card>
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

            <Card>
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
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Service Categories</h3>
            <p className="text-xl text-gray-600">
              Wide range of enterprise services from verified vendors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {services.map((service) => {
            const Icon = service.icon;
            return (<Card key={service.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative h-32 overflow-hidden rounded-t-lg">
                      <ImageWithFallback src={service.image} alt={service.title} className="w-full h-full object-cover"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"/>
                      <div className="absolute bottom-3 left-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600"/>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900">{service.title}</h4>
                    </div>
                  </CardContent>
                </Card>);
        })}
          </div>
        </div>
      </section>

      {/* AI Cost Estimation Highlight */}
      <section id="costestimation" className="py-20 bg-[#6b76f6]">
        <div className="max-w-7xl mx-auto px-6">
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
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1"/>
                  <span className="text-lg">Instant cost predictions based on historical data</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1"/>
                  <span className="text-lg">Accurate time estimates for project planning</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1"/>
                  <span className="text-lg">Budget optimization recommendations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-4xl font-bold text-gray-900 mb-6">About CorpServe</h3>
          <p className="text-xl text-gray-600 mb-8">
            CorpServe is a comprehensive B2B Enterprise Service Management System designed to
            streamline the way companies connect with verified service providers. Our platform
            ensures transparency, efficiency, and quality in every business transaction.
          </p>
          <ImageWithFallback src="https://images.unsplash.com/photo-1696861273647-92dfe8bb697c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBzZXJ2aWNlcyUyMGhhbmRzaGFrZXxlbnwxfHx8fDE3NzI2Njg0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Professional handshake" className="rounded-2xl shadow-xl w-full max-w-2xl mx-auto"/>
        </div>
      </section>

      {/* Footer */}
      <footer id="contactus" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">CS</span>
                </div>
                <h4 className="text-xl font-bold">CorpServe</h4>
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

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 CorpServe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);
}
