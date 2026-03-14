import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success('Password reset link sent to your email');
        setSubmitted(true);
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">CS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">CorpServe</h1>
          </div>
          <p className="text-gray-600">Reset your password</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              {submitted
            ? 'Check your email for reset instructions'
            : 'Enter your email address and we\'ll send you a reset link'}
            </CardDescription>
          </CardHeader>

          {!submitted ? (<form onSubmit={handleSubmit}>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                    <Input id="email" type="email" placeholder="you@company.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full">
                  Send Reset Link
                </Button>
                <Link to="/login" className="w-full">
                  <Button type="button" variant="outline" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4"/>
                    Back to Login
                  </Button>
                </Link>
              </CardFooter>
            </form>) : (<CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-900">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your
                  inbox and follow the instructions.
                </p>
              </div>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4"/>
                  Back to Login
                </Button>
              </Link>
            </CardContent>)}
        </Card>
      </div>
    </div>);
}
