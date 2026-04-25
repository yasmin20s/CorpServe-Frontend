import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';

const NO_ENTRY_LABELS = ['NO ENTRY', 'NO ENTRY', 'NO ENTRY'];

function getDashboardPathForRole(role) {
	const roleKey = String(role || '').toLowerCase();
	const dashboardByRole = {
		admin: '/admin/dashboard',
		vendor: '/vendor/dashboard',
		client: '/client/dashboard',
	};

	return dashboardByRole[roleKey] || '/client/dashboard';
}

export default function ForbiddenPage() {
	const navigate = useNavigate();
	const { user } = useAuth();
	const isAuthenticated = Boolean(user?.isAuthenticated && user?.token);
	const dashboardPath = useMemo(() => getDashboardPathForRole(user?.role), [user?.role]);
	const ctaPath = isAuthenticated ? dashboardPath : '/';
	const ctaLabel = isAuthenticated ? 'Return to Dashboard' : 'Return to Home Page';

	return (
		<main className="min-h-screen bg-[#ffffff] px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:px-16 xl:px-20" style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}>
			<div className="mx-auto grid min-h-[100dvh] w-full max-w-[1280px] grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,520px)_auto] lg:justify-center lg:gap-10 xl:gap-12">
				<section className="order-2 mx-auto flex w-full max-w-[520px] flex-col items-start text-left lg:order-1 lg:mx-0">
					<h1 className="mb-3 text-[86px] font-extrabold leading-none tracking-[-0.04em] text-[#3f3f46] sm:text-[102px] lg:mb-4 lg:text-[120px]">403</h1>
					<h2 className="mb-5 text-[31px] font-medium leading-[1.2] tracking-[-0.02em] text-[#71717a] sm:text-[34px] lg:mb-6 lg:text-[36px]">Acess forbidden</h2>
					<p className="mb-9 max-w-md text-[18px] leading-[1.55] text-[#71717a] sm:text-[19px] lg:mb-10 lg:text-[20px]">
						You&apos;ve tried access a page you did not have prior authorization for.
					</p>
					<button
						type="button"
						onClick={() => navigate(ctaPath, { replace: true })}
						className="rounded-full bg-[#6b21a8] px-7 py-3.5 text-base font-medium text-white shadow-sm transition-all hover:bg-[#581c87] active:scale-95 sm:px-8 sm:py-4 sm:text-lg"
					>
						{ctaLabel}
					</button>
				</section>

				<section className="order-1 relative flex h-[320px] items-end justify-center sm:h-[360px] lg:order-2 lg:h-[400px] lg:justify-start lg:justify-self-start">
					<div className="absolute bottom-0 right-0 h-[2px] w-full bg-[#d4d4d8] lg:w-[120%]" />

					<div className="relative mb-[2px] origin-bottom scale-[0.9] sm:scale-100">
						<div className="relative flex h-[292px] w-[200px] items-center justify-center overflow-visible rounded-t-full border-r-[10px] border-[#6b21a8] bg-[#09090b] sm:h-[320px] sm:w-[220px] sm:border-r-[12px]">
							<div className="mb-20 flex gap-3 sm:mb-24">
								<span className="h-[2px] w-3 bg-[#d4d4d8]" />
								<span className="h-[2px] w-3 bg-[#d4d4d8]" />
							</div>

							<div className="absolute bottom-24 -left-10 -right-10 z-20 sm:bottom-28 sm:-left-12 sm:-right-12">
								<div className="absolute bottom-[-108px] left-0 h-[132px] w-[10px] bg-[#e4e4e7] sm:bottom-[-112px] sm:h-[140px] sm:w-3" />
								<div className="absolute bottom-[-108px] right-0 h-[132px] w-[10px] bg-[#e4e4e7] sm:bottom-[-112px] sm:h-[140px] sm:w-3" />

								<div className="flex h-7 w-full items-center justify-around bg-[#fde047] px-2 shadow-sm sm:h-8">
									{NO_ENTRY_LABELS.map((label, index) => (
										<span key={`${label}-${index}`} className="text-[9px] font-bold uppercase tracking-tighter text-[#71717a] sm:text-[10px]">
											{label}
										</span>
									))}
								</div>
							</div>
						</div>

						<div className="absolute -left-5 bottom-0 flex items-end gap-1 sm:-left-6">
							<div className="h-7 w-1 rotate-[-5deg] rounded-full bg-[#86efac] sm:h-8" />
							<div className="h-10 w-1 rotate-[5deg] rounded-full bg-[#86efac] sm:h-12" />
							<div className="h-5 w-1 rounded-full bg-[#86efac] sm:h-6" />
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
