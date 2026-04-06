import { useState } from 'react';
import { motion } from 'motion/react';
import DashboardLayout from '../../components/DashboardLayout';
import DarkVeil from '../../components/backgrounds/DarkVeil';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  CheckCircle,
  TrendingUp,
  Eye,
  CheckSquare,
  X,
  Building2,
  Wallet,
  CalendarClock,
  ArrowRight,
  Sparkles,
  FileText,
  UserRound,
  Tag,
  Info,
} from 'lucide-react';
import { toast } from '../../lib/toast';

const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard', icon: <LayoutDashboard className="w-5 h-5"/> },
    { label: 'Available Requests', path: '/vendor/available-requests', icon: <Briefcase className="w-5 h-5"/> },
    { label: 'Active Requests', path: '/vendor/active-requests', icon: <Activity className="w-5 h-5"/> },
    { label: 'Completed', path: '/vendor/completed', icon: <CheckCircle className="w-5 h-5"/> },
    { label: 'Analytics', path: '/vendor/analytics', icon: <TrendingUp className="w-5 h-5"/> },
];
const requests = [
    {
      id: '1',
      title: 'Security System Installation',
      company: 'Acme Corp',
      clientName: 'Acme Corp - Facilities Division',
      category: 'Security',
      budget: 'EGP 15,000 - EGP 20,000',
      deadline: '2026-04-30',
      description: 'Need comprehensive security system with CCTV, access control, and monitoring.',
      fullDescription:
        'Acme Corp requires a full security deployment across two office floors and one warehouse zone. Scope includes HD CCTV cameras, access control points, recording storage, and a monitoring dashboard with role-based access. Vendor should include implementation plan, warranty terms, and training session for internal staff.',
      posted: '2 days ago',
    },
    {
      id: '2',
      title: 'Network Infrastructure Upgrade',
      company: 'TechStart Inc',
      clientName: 'TechStart Inc - IT Operations',
      category: 'IT Support',
      budget: 'EGP 25,000 - EGP 30,000',
      deadline: '2026-05-15',
      description: 'Upgrade entire office network infrastructure including servers and switches.',
      fullDescription:
        'TechStart is modernizing its office network to support growth and higher traffic. Project includes replacing legacy switches, improving structured cabling paths, VLAN segmentation, firewall policy hardening, and server rack organization. Proposal should cover migration phases, downtime strategy, and post-go-live support window.',
      posted: '1 week ago',
    },
];

const heroIconTiles = [
  { label: 'Corporate', icon: Building2 },
  { label: 'Quick Scope', icon: CalendarClock },
  { label: 'High Value', icon: TrendingUp },
  { label: 'Open Requests', icon: Briefcase },
];

const proposalSteps = [
  'Review scope',
  'Set budget & timeline',
  'Write your approach',
  'Submit proposal',
];

export default function AvailableRequests() {
    const [proposal, setProposal] = useState({ budget: '', deadline: '', message: '' });

    const handleSubmitProposal = () => {
        toast.success('Proposal submitted successfully!');
        setProposal({ budget: '', deadline: '', message: '' });
    };

    const handleDeclineRequest = (requestTitle) => {
      toast.info('Request declined', {
        details: `You declined ${requestTitle}. You can still review other opportunities.`,
      });
    };

  return (
    <DashboardLayout menuItems={menuItems} userRole="vendor">
      <div className="space-y-6 lg:space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-200/50 bg-gradient-to-br from-violet-800 via-indigo-700 to-blue-700 p-4 text-white sm:p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0">
            <DarkVeil
              hueShift={0}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={3}
              scanlineFrequency={0}
              warpAmount={0}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-900/55 via-indigo-900/50 to-blue-900/55" />

          <motion.div
            className="pointer-events-none absolute -left-20 top-6 h-56 w-56 rounded-full bg-violet-300/25 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, 14, 0], scale: [1, 1.07, 1] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl"
            animate={{ x: [0, -22, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-4"
            >
              <Badge className="w-fit border border-violet-200/40 bg-violet-200/10 text-violet-100">Vendor Opportunity Hub</Badge>
              <h1 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Win better contracts with fast, polished proposals
              </h1>
              <p className="max-w-xl text-sm text-slate-200 sm:text-base">
                Explore open service requests from verified companies, spot urgent opportunities, and submit proposals in minutes.
              </p>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="grid grid-cols-2 gap-3">
                {heroIconTiles.map((tile, index) => {
                  const Icon = tile.icon;

                  return (
                    <motion.div
                      key={tile.label}
                      className="flex items-center gap-2 rounded-xl border border-violet-200/40 bg-white/5 px-3 py-2 text-xs text-slate-100 backdrop-blur sm:text-sm"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + index * 0.1 }}
                    >
                      <motion.span
                        animate={{ scale: [1, 1.16, 1], rotate: [0, 6, 0] }}
                        transition={{ duration: 2 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex h-7 w-7 items-center justify-center border border-violet-200/40 bg-gradient-to-br from-violet-400/30 via-blue-300/25 to-indigo-300/30 [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]"
                      >
                        <Icon className="h-4 w-4 text-violet-100" />
                      </motion.span>
                      {tile.label}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-start sm:justify-end">
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Badge className="w-fit gap-2 border border-violet-300 bg-gradient-to-r from-violet-100 to-blue-100 px-4 py-1.5 text-sm font-semibold text-violet-800 shadow-sm sm:text-base">
                <Briefcase className="h-4 w-4" />
                {requests.length} Active Requests
              </Badge>
            </motion.div>
          </div>

          <div className="grid gap-4 lg:gap-5">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden border-2 border-violet-200 bg-white shadow-sm">
                  <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-500" />

                  <CardHeader className="pb-0">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-slate-900">{request.title}</CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-cyan-600" />
                            {request.company}
                          </span>
                          <span className="text-slate-300">•</span>
                          <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-700">
                            {request.category}
                          </Badge>
                          <span className="text-slate-300">•</span>
                          <span>Posted {request.posted}</span>
                        </div>
                      </div>

                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        High Match Potential
                      </motion.div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-slate-700 sm:text-base">{request.description}</p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Budget range</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <Wallet className="h-4 w-4 text-emerald-600" />
                          {request.budget}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Deadline</p>
                        <p className="inline-flex items-center gap-1 font-semibold text-slate-900">
                          <CalendarClock className="h-4 w-4 text-amber-600" />
                          {request.deadline}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="group gap-2 border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.9)] hover:brightness-110">
                            <motion.span
                              animate={{ scale: [1, 1.14, 1] }}
                              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <CheckSquare className="h-4 w-4"/>
                            </motion.span>
                            Submit Proposal
                            <motion.span
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </motion.span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white/95 via-violet-50/85 to-blue-50/90 shadow-[0_24px_80px_-35px_rgba(76,29,149,0.65)] backdrop-blur-md sm:max-w-2xl">
                          <motion.div
                            className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-violet-300/35 blur-3xl"
                            animate={{ x: [0, 14, 0], y: [0, 10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div
                            className="pointer-events-none absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-blue-300/35 blur-3xl"
                            animate={{ x: [0, -16, 0], y: [0, -8, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
                          />

                          <DialogHeader>
                            <DialogTitle className="text-xl text-slate-900">Submit Proposal</DialogTitle>
                          </DialogHeader>
                          <div className="relative space-y-5 py-2">
                            <div className="rounded-xl border border-violet-200/70 bg-white/70 p-3 backdrop-blur">
                              <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-violet-700">Proposal Flow</p>
                              <div className="grid gap-2 sm:grid-cols-4">
                                {proposalSteps.map((step, stepIndex) => (
                                  <motion.div
                                    key={step}
                                    className="flex items-center gap-2 rounded-lg border border-violet-100/80 bg-white/70 px-2 py-2"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 + stepIndex * 0.08 }}
                                  >
                                    <motion.span
                                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-500 text-[11px] font-semibold text-white"
                                      animate={{ scale: [1, 1.15, 1] }}
                                      transition={{ duration: 1.9 + stepIndex * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                      {stepIndex + 1}
                                    </motion.span>
                                    <span className="text-[11px] font-medium leading-4 text-slate-700">{step}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-xl border border-violet-200 bg-white/80 p-4">
                              <p className="text-sm font-semibold text-slate-900">{request.title}</p>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <UserRound className="h-4 w-4 text-violet-600" />
                                  {request.clientName}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <Tag className="h-4 w-4 text-blue-600" />
                                  {request.category}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <Wallet className="h-4 w-4 text-emerald-600" />
                                  {request.budget}
                                </div>
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:text-sm">
                                  <CalendarClock className="h-4 w-4 text-amber-600" />
                                  Deadline: {request.deadline}
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Proposed Budget</Label>
                                <Input
                                  type="number"
                                  placeholder="Enter amount"
                                  value={proposal.budget}
                                  onChange={(e) => setProposal({ ...proposal, budget: e.target.value })}
                                  className="border-violet-200 bg-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Proposed Deadline</Label>
                                <Input
                                  type="date"
                                  value={proposal.deadline}
                                  onChange={(e) => setProposal({ ...proposal, deadline: e.target.value })}
                                  className="border-violet-200 bg-white"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Proposal Message</Label>
                              <Textarea
                                rows={5}
                                placeholder="Describe your approach, timeline, and key deliverables..."
                                value={proposal.message}
                                onChange={(e) => setProposal({ ...proposal, message: e.target.value })}
                                className="border-violet-200 bg-white"
                              />
                            </div>
                            <Button
                              onClick={handleSubmitProposal}
                              className="w-full border-0 bg-[linear-gradient(100deg,#7c3aed_0%,#4f46e5_45%,#2563eb_100%)] text-white hover:brightness-110"
                            >
                              Submit Proposal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2 border-slate-300 text-slate-700">
                            <motion.span
                              animate={{ rotate: [0, 8, 0] }}
                              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <Eye className="h-4 w-4"/>
                            </motion.span>
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85vh] overflow-x-hidden overflow-y-auto overscroll-contain border-violet-200/80 bg-gradient-to-br from-white via-violet-50/40 to-blue-50/60 shadow-[0_24px_80px_-35px_rgba(37,99,235,0.45)] backdrop-blur sm:max-w-2xl">
                          <motion.div
                            className="pointer-events-none absolute -left-10 top-2 h-36 w-36 rounded-full bg-violet-200/40 blur-3xl"
                            animate={{ x: [0, 14, 0], y: [0, 6, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <DialogHeader>
                            <DialogTitle className="bg-gradient-to-r from-violet-700 to-black bg-clip-text text-xl text-transparent">Request Details</DialogTitle>
                          </DialogHeader>
                          <div className="relative space-y-4 py-2">
                            <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-4">
                              <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                              <p className="mt-1 text-sm text-slate-600">Posted {request.posted}</p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <UserRound className="h-4 w-4 text-violet-600" />
                                Client: {request.clientName}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <Tag className="h-4 w-4 text-blue-600" />
                                Category: {request.category}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <Wallet className="h-4 w-4 text-emerald-600" />
                                Price Range: {request.budget}
                              </div>
                              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                <CalendarClock className="h-4 w-4 text-amber-600" />
                                Deadline: {request.deadline}
                              </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                              <p className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-800">
                                <FileText className="h-4 w-4 text-indigo-600" />
                                Full Description
                              </p>
                              <p className="text-sm leading-6 text-slate-600">{request.fullDescription}</p>
                            </div>

                            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-sm text-slate-700">
                              <p className="inline-flex items-center gap-1 font-medium text-slate-800">
                                <Info className="h-4 w-4 text-violet-600" />
                                Tip
                              </p>
                              <p className="mt-1">Tailor your proposal to this scope and include milestones to increase your win chance.</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50">
                            <motion.span
                              animate={{ rotate: [0, -10, 0] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <X className="h-4 w-4"/>
                            </motion.span>
                            Decline
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You are about to decline "{request.title}" from {request.company}. This action will dismiss it from your current opportunities list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeclineRequest(request.title)}
                            >
                              Yes, Decline
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

