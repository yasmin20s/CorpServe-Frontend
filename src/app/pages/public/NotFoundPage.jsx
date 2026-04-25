import { Link } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

function getDashboardPathForRole(role) {
  switch ((role || '').toLowerCase()) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}

export default function NotFoundPage() {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.isAuthenticated && user?.token);
  const ctaPath = isAuthenticated ? getDashboardPathForRole(user?.role) : '/';
  const ctaLabel = isAuthenticated ? 'Return to Dashboard' : 'Return to Home Page';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#ededf0] px-4 py-10 text-center sm:px-6" style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}>
      <section className="mb-6">
        <h1 aria-label="404" className="select-none text-[clamp(6rem,16vw,10rem)] font-extrabold leading-none tracking-[-0.02em] text-[#5b45e6]">
          404
        </h1>
      </section>

      <section className="max-w-3xl">
        <h2 className="mb-4 text-[clamp(1.6rem,4vw,2.4rem)] font-bold text-[#131c3a]">Oops! Page Not Found</h2>
        <p className="mb-8 text-[clamp(0.95rem,1.8vw,1.25rem)] font-normal text-[#4a5568]">
          It seems you&apos;ve wandered into unknown territory. Let&apos;s get you back home.
        </p>

        <Link
          to={ctaPath}
          className="inline-block rounded-lg bg-[#5b45e6] px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#4d3bd0] focus:outline-none focus:ring-2 focus:ring-[#5b45e6] focus:ring-offset-2"
        >
          {ctaLabel}
        </Link>
      </section>
    </main>
  );
}
