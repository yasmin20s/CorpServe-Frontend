import { Link } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function AppFooter() {
  return (
    <footer className="bg-gray-900 py-10 text-white">
      <div className="mx-auto w-full max-w-7xl px-6">
        <div className="mb-7 grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(95,111,232)]">
                <span className="text-xl font-bold text-white">CS</span>
              </div>
              <h4 className="text-xl font-bold">CorpServe</h4>
            </div>
            <p className="text-sm text-gray-400">Your trusted B2B Enterprise Service Management System</p>
          </div>

          <div>
            <h5 className="mb-4 font-semibold">Quick Links</h5>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link to="/signup" className="transition-colors hover:text-white">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/login" className="transition-colors hover:text-white">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="mb-4 font-semibold">Contact Info</h5>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-5 w-5 shrink-0" />
                <span>contact@corpserve.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-5 w-5 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <span>123 Business Ave, Suite 100, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-7 text-center text-sm text-gray-400">
          <p>&copy; 2026 CorpServe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
