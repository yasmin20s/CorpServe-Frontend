import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, CheckCircle2, FileBadge2, FileText, ShieldCheck, Upload, X } from 'lucide-react';
import { toast } from '../../lib/toast';
import { useAuth } from '../../hooks/useAuth';
import { getApiBaseUrl } from '../../services/apiClient';
import { getVendorVerificationStatusApi, submitVendorVerificationApi } from '../../services/vendorVerifyApi';

const REQUIRED_DOCS = ['Commercial Registration', 'Tax Card', 'Portfolio / Previous Work'];

function parseVerificationStatus(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'pending') return 1;
    if (normalized === 'approved') return 2;
    if (normalized === 'rejected') return 3;
    const numeric = Number.parseInt(raw, 10);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

function getCleanDisplayFileName(file) {
  const rawName = file?.name || file?.fileUrl?.split('/').pop() || 'Submitted file';
  if (rawName.includes('_')) {
    const [prefix, ...rest] = rawName.split('_');
    const isGuidPrefix = /^[0-9a-fA-F-]{32,}$/.test(prefix);
    if (isGuidPrefix && rest.length > 0) {
      return rest.join('_');
    }
  }
  return rawName;
}

export default function VendorVerification() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [organizationName, setOrganizationName] = useState('');
  const [status, setStatus] = useState('awaiting_documents');
  const [rejectReason, setRejectReason] = useState('');
  const [submittedCertificates, setSubmittedCertificates] = useState([]);
  const [showFirstApprovedAction, setShowFirstApprovedAction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const approvedSeenKey = `vendor-approved-seen:${user?.email || 'unknown'}`;

  const hasAllRequiredDocuments = uploadedFiles.length >= REQUIRED_DOCS.length;
  const canSubmit = hasAllRequiredDocuments && organizationName.trim().length > 0 && !isSubmitting;

  const statusLabel = useMemo(() => {
    if (status === 'pending') return 'Pending Admin Approval';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return 'Awaiting Documents to Upload';
  }, [status]);

  useEffect(() => {
    const loadStatus = async () => {
      if (!user?.token) {
        return;
      }

      try {
        const response = await getVendorVerificationStatusApi(user.token);
        if (!response) {
          return;
        }

        const parsedStatus = parseVerificationStatus(response.status);
        const statusMap = {
          1: 'pending',
          2: 'approved',
          3: 'rejected',
        };
        const mappedStatus = statusMap[parsedStatus] || 'awaiting_documents';

        setOrganizationName(response.organizationName || '');
        setStatus(mappedStatus);
        setRejectReason(response.rejectReason || '');
        setSubmittedCertificates(Array.isArray(response.certificates) ? response.certificates : []);

        if (mappedStatus === 'approved') {
          const seenApproved = localStorage.getItem(approvedSeenKey) === '1';
          setShowFirstApprovedAction(!seenApproved);
        } else {
          setShowFirstApprovedAction(false);
        }
      } catch (error) {
        if (error.status !== 404) {
          toast.error(error.message || 'Failed to load verification status');
        }
      }
    };

    loadStatus();
  }, [approvedSeenKey, user?.token]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const availableSlots = REQUIRED_DOCS.length - uploadedFiles.length;
    if (availableSlots <= 0) {
      toast.error('All required documents are already uploaded');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
    }

    const nextFiles = [...uploadedFiles, ...validFiles.slice(0, availableSlots)];
    setUploadedFiles(nextFiles);

    if (nextFiles.length >= REQUIRED_DOCS.length) {
      toast.success('All required documents uploaded. Click Submit for admin review');
    } else {
      toast.success('Document uploaded successfully');
    }

    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    setStatus('awaiting_documents');
  };

  const handleViewFile = (fileOrUrl) => {
    if (typeof fileOrUrl === 'string') {
      const absoluteUrl = fileOrUrl.startsWith('http')
        ? fileOrUrl
        : `${getApiBaseUrl()}${fileOrUrl.startsWith('/') ? '' : '/'}${fileOrUrl}`;
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const previewUrl = URL.createObjectURL(fileOrUrl);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
  };

  const handleSubmit = async () => {
    if (!user?.token) {
      toast.error('Please login as a vendor first');
      return;
    }
    if (!organizationName.trim()) {
      toast.error('Organization name is required');
      return;
    }
    if (!hasAllRequiredDocuments) {
      toast.error('Please upload all required documents first');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitVendorVerificationApi({
        organizationName: organizationName.trim(),
        documents: uploadedFiles,
        token: user.token,
      });
      setSubmittedCertificates([...uploadedFiles]);
      setStatus('pending');
      setRejectReason('');
      setShowFirstApprovedAction(false);
      toast.success('Your documents are pending admin approval');
    } catch (error) {
      toast.error(error.message || 'Failed to submit verification documents');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    localStorage.setItem(approvedSeenKey, '1');
    setShowFirstApprovedAction(false);
    navigate('/vendor/dashboard');
  };

  return (
    <div className="min-h-dvh bg-[#f4f5f8] px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8 lg:pb-12 lg:pt-5 xl:px-10">
      <div className="mx-auto flex w-full max-w-[1140px] items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/30 bg-[#6f74ea] text-2xl font-black text-white shadow-[0_10px_28px_rgba(99,102,241,0.4)] sm:h-[52px] sm:w-[52px] sm:text-2xl">
            CS
          </div>
          <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">CorpServe</h1>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 sm:text-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Go to Login
        </Link>
      </div>

      <div className="mx-auto mt-3 w-full max-w-[1080px] rounded-[1.4rem] bg-white p-2 sm:p-2.5 shadow-[0_24px_70px_rgba(14,20,50,0.08)] lg:mt-3 lg:p-3">
        <div className="grid gap-3 lg:h-full lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
          <section className="relative h-[390px] overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-[#08112f] via-[#101843] to-[#131f55] p-4 sm:h-[420px] sm:p-4.5 lg:h-[460px] lg:p-5">
            <div className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />
            <div className="absolute -bottom-24 right-[-72px] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col items-center text-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-100">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-300" />
                SECURE PORTAL
              </span>
              <h2 className="mt-4 text-lg font-black leading-[1.08] tracking-tight text-white sm:text-xl lg:text-2xl">
                Verify Your
                <br />
                <span className="text-violet-400">Business</span>
              </h2>
              <p className="mt-3 max-w-[320px] text-xs leading-relaxed text-slate-300 sm:text-sm">
                Complete the verification process to unlock full platform access and build trust within our secure
                network.
              </p>
              <div className="relative mt-auto flex items-center justify-center pt-4">
                <div className="relative h-32 w-32 sm:h-36 sm:w-36">
                  <div className="absolute inset-0 rounded-full border border-violet-300/30" />
                  <div className="absolute inset-5 rounded-full border border-blue-300/20" />
                  <div className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 shadow-[0_0_45px_rgba(99,102,241,0.45)] sm:h-20 sm:w-20">
                    <ShieldCheck className="h-6 w-6 text-white sm:h-7 sm:w-7" />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex w-full max-w-[320px] items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-300/20 bg-blue-500/10 sm:h-12 sm:w-12">
                  <FileBadge2 className="h-5 w-5 text-blue-200" />
                </div>
                <div className="h-[3px] flex-1 rounded-full bg-gradient-to-r from-blue-300/25 to-transparent" />
                <CheckCircle2 className="h-5 w-5 text-slate-300/80" />
              </div>
            </div>
          </section>

          <section className="relative flex flex-col rounded-[1.2rem] bg-white px-4 py-4 sm:px-5 sm:py-5 lg:h-full lg:px-6 lg:py-6">
            <h3 className="text-xl font-black tracking-tight text-violet-800 sm:text-2xl">Document Upload</h3>
            <p className="mt-2.5 max-w-[620px] text-sm leading-relaxed text-slate-500 sm:text-base">
              Upload your business credentials. All documents are encrypted before being reviewed by our admin team.
            </p>

            {!user?.token && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 sm:p-3.5">
                <p className="text-sm font-bold text-red-700 sm:text-base">You need vendor login first</p>
                <p className="mt-0.5 text-xs text-red-600 sm:text-sm">
                  Login with your vendor account before submitting verification documents.
                </p>
              </div>
            )}

            {status === 'rejected' && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 sm:p-3.5">
                <p className="text-sm font-bold text-red-800 sm:text-base">Status: Rejected</p>
                <p className="mt-1 text-xs text-red-700 sm:text-sm">
                  Reason: {rejectReason || 'No reject reason provided by admin.'}
                </p>
              </div>
            )}

            {status !== 'pending' && status !== 'approved' && status !== 'rejected' && (
              <div className="mt-4 rounded-xl border border-indigo-300 bg-indigo-100 p-3 sm:p-3.5">
                <p className="text-sm font-bold text-slate-800 sm:text-base">Status: {statusLabel}</p>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Please upload all required files, then submit for review.
                </p>
              </div>
            )}

            {status === 'approved' && (
              <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 sm:p-3.5">
                <p className="text-sm font-bold text-emerald-800 sm:text-base">Status: Approved</p>
                <p className="mt-0.5 text-xs text-emerald-700 sm:text-sm">
                  Your verification has been approved by the admin team.
                </p>
                {showFirstApprovedAction && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={handleGoToDashboard}
                      className="h-9 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-xs font-bold text-white hover:from-blue-700 hover:to-violet-700"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5">
              <div className="flex items-center gap-3">
                <Label className="text-lg font-bold text-slate-800 sm:text-xl">Required Documents</Label>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold tracking-wide text-slate-500">
                  MAX {REQUIRED_DOCS.length}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {REQUIRED_DOCS.map((doc, idx) => (
                  <div
                    key={doc}
                    className={`flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 sm:text-sm ${
                      idx === 2 ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <FileBadge2 className="h-4 w-4 text-violet-500" />
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="organization-name" className="text-sm font-bold text-slate-800 sm:text-base">
                Organization Name
              </Label>
              <Input
                id="organization-name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter your organization name"
                className="h-10 rounded-lg border-slate-200 bg-white sm:h-11"
                disabled={status === 'pending' || status === 'approved' || isSubmitting}
                required
              />
            </div>

            {status === 'awaiting_documents' || status === 'rejected' ? (
              <>
                <div className="mt-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-center transition hover:border-violet-400">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <h4 className="text-xl font-black text-blue-500 sm:text-2xl">Upload Documents</h4>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">Drag & drop or click to browse</p>
                  <p className="mt-1 text-xs text-slate-400">PDF, JPG, PNG up to 10MB</p>
                  <label htmlFor="vendor-doc-upload" className="mt-4 inline-block">
                    <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 text-xs font-bold text-white shadow-md shadow-violet-500/25 hover:from-blue-700 hover:to-violet-700 sm:text-sm">
                      Choose Files
                    </span>
                  </label>
                  <input
                    id="vendor-doc-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadedFiles.length >= REQUIRED_DOCS.length}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <Label className="text-sm font-bold text-slate-800">
                      Uploaded Documents ({uploadedFiles.length}/{REQUIRED_DOCS.length})
                    </Label>
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-violet-500" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800 sm:text-sm">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 rounded-md border-violet-200 px-3 text-xs font-bold text-violet-700 hover:bg-violet-50"
                            onClick={() => handleViewFile(file)}
                          >
                            View
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={handleSubmit}
                    className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold shadow-md shadow-violet-500/20 hover:from-blue-700 hover:to-violet-700"
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                  </Button>
                </div>
              </>
            ) : status === 'pending' ? (
              <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm font-bold text-yellow-800 sm:text-base">Status: Pending Admin Approval</p>
                <p className="mt-1 text-xs text-yellow-700 sm:text-sm">
                  Your documents were submitted successfully and are now under review.
                </p>

                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-bold text-slate-800">Submitted Files</Label>
                  {(submittedCertificates.length > 0 ? submittedCertificates : uploadedFiles).map((file, index) => (
                    <div
                      key={`${file.name || file.fileUrl || 'submitted-file'}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-violet-500" />
                        <p className="text-xs font-semibold text-slate-800 sm:text-sm">{getCleanDisplayFileName(file)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-md border-violet-200 px-3 text-xs font-bold text-violet-700 hover:bg-violet-50"
                        onClick={() => handleViewFile(file.fileUrl || file)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

