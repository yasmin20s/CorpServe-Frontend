import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Upload, FileText, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
export default function VendorVerification() {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [status] = useState('pending');
    const requiredDocs = [
        'Commercial Registration',
        'Tax Card',
        'Portfolio / Previous Work Samples',
    ];
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (uploadedFiles.length + files.length > 3) {
            toast.error('Maximum 3 documents allowed');
            return;
        }
        setUploadedFiles([...uploadedFiles, ...files]);
        toast.success('Document uploaded successfully');
    };
    const handleRemoveFile = (index) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
    };
    const handleSubmit = () => {
        if (uploadedFiles.length === 0) {
            toast.error('Please upload at least one document');
            return;
        }
        toast.success('Documents submitted for verification');
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">CS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CorpServe</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Verification</h2>
          <p className="text-gray-600">Submit your documents for admin approval</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>
              Upload up to 3 documents for verification. All documents will be reviewed by our admin team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600"/>
              <span className="font-medium text-yellow-900">Status: Pending Admin Approval</span>
            </div>

            {/* Required Documents List */}
            <div>
              <Label className="text-base mb-3 block">Required Documents:</Label>
              <ul className="space-y-2">
                {requiredDocs.map((doc, index) => (<li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"/>
                    {doc}
                  </li>))}
              </ul>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                PDF, JPG, PNG up to 10MB (Max 3 files)
              </p>
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" asChild>
                  <span className="cursor-pointer">Choose Files</span>
                </Button>
              </label>
              <input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={uploadedFiles.length >= 3}/>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (<div className="space-y-2">
                <Label className="text-base">Uploaded Documents ({uploadedFiles.length}/3):</Label>
                {uploadedFiles.map((file, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600"/>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                      Remove
                    </Button>
                  </div>))}
              </div>)}

            <div className="flex gap-3">
              <Button onClick={handleSubmit} className="flex-1" disabled={uploadedFiles.length === 0}>
                Submit for Verification
              </Button>
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What happens next?</p>
                  <p>
                    Our admin team will review your documents within 24-48 hours. You'll receive an
                    email notification once your account is approved.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
