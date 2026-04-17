import { Card, CardContent } from './ui/card';
function getAccentKey(value) {
  const source = String(value || '').toLowerCase();
  if (source.includes('emerald')) return 'emerald';
  if (source.includes('cyan')) return 'cyan';
  if (source.includes('green')) return 'green';
  if (source.includes('blue')) return 'blue';
  if (source.includes('orange')) return 'orange';
  if (source.includes('yellow')) return 'yellow';
  if (source.includes('purple') || source.includes('violet')) return 'purple';
  if (source.includes('red')) return 'red';
  return 'blue';
}

const ACCENT_STYLES = {
  blue: {
    card: 'border-blue-200/80 bg-gradient-to-br from-white to-blue-50/70 shadow-[0_10px_24px_rgba(59,130,246,0.10)] dark:border-blue-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-blue-950/35 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-blue-200/80 shadow-[0_8px_16px_rgba(59,130,246,0.18)] dark:border-blue-400/35 dark:bg-blue-500/20 dark:shadow-[0_10px_20px_rgba(59,130,246,0.24)]',
    icon: 'dark:text-blue-200',
  },
  orange: {
    card: 'border-orange-200/80 bg-gradient-to-br from-white to-orange-50/70 shadow-[0_10px_24px_rgba(249,115,22,0.10)] dark:border-orange-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-orange-950/30 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-orange-200/80 shadow-[0_8px_16px_rgba(249,115,22,0.18)] dark:border-orange-400/35 dark:bg-orange-500/18 dark:shadow-[0_10px_20px_rgba(249,115,22,0.24)]',
    icon: 'dark:text-orange-200',
  },
  green: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/70 shadow-[0_10px_24px_rgba(16,185,129,0.10)] dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-emerald-950/30 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-emerald-200/80 shadow-[0_8px_16px_rgba(16,185,129,0.18)] dark:border-emerald-400/35 dark:bg-emerald-500/18 dark:shadow-[0_10px_20px_rgba(16,185,129,0.24)]',
    icon: 'dark:text-emerald-200',
  },
  yellow: {
    card: 'border-yellow-200/80 bg-gradient-to-br from-white to-amber-50/70 shadow-[0_10px_24px_rgba(234,179,8,0.10)] dark:border-yellow-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-amber-950/28 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-yellow-200/80 shadow-[0_8px_16px_rgba(234,179,8,0.18)] dark:border-yellow-400/35 dark:bg-yellow-500/20 dark:shadow-[0_10px_20px_rgba(234,179,8,0.24)]',
    icon: 'dark:text-yellow-200',
  },
  purple: {
    card: 'border-violet-200/80 bg-gradient-to-br from-white to-violet-50/70 shadow-[0_10px_24px_rgba(139,92,246,0.10)] dark:border-violet-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-violet-950/34 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-violet-200/80 shadow-[0_8px_16px_rgba(139,92,246,0.18)] dark:border-violet-400/35 dark:bg-violet-500/20 dark:shadow-[0_10px_20px_rgba(139,92,246,0.24)]',
    icon: 'dark:text-violet-200',
  },
  red: {
    card: 'border-rose-200/80 bg-gradient-to-br from-white to-rose-50/70 shadow-[0_10px_24px_rgba(244,63,94,0.10)] dark:border-rose-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-rose-950/30 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-rose-200/80 shadow-[0_8px_16px_rgba(244,63,94,0.18)] dark:border-rose-400/35 dark:bg-rose-500/18 dark:shadow-[0_10px_20px_rgba(244,63,94,0.24)]',
    icon: 'dark:text-rose-200',
  },
  emerald: {
    card: 'border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/70 shadow-[0_10px_24px_rgba(16,185,129,0.10)] dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-emerald-950/32 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-emerald-200/80 shadow-[0_8px_16px_rgba(16,185,129,0.18)] dark:border-emerald-400/35 dark:bg-emerald-500/18 dark:shadow-[0_10px_20px_rgba(16,185,129,0.24)]',
    icon: 'dark:text-emerald-200',
  },
  cyan: {
    card: 'border-cyan-200/80 bg-gradient-to-br from-white to-cyan-50/70 shadow-[0_10px_24px_rgba(6,182,212,0.10)] dark:border-cyan-500/30 dark:bg-gradient-to-br dark:from-slate-900 dark:to-cyan-950/30 dark:shadow-[0_12px_24px_rgba(15,23,42,0.28)]',
    iconWrap: 'border border-cyan-200/80 shadow-[0_8px_16px_rgba(6,182,212,0.18)] dark:border-cyan-400/35 dark:bg-cyan-500/18 dark:shadow-[0_10px_20px_rgba(6,182,212,0.24)]',
    icon: 'dark:text-cyan-200',
  },
};

export default function StatsCard({ title, value, icon: Icon, iconColor = 'text-blue-600', iconBgColor = 'bg-blue-100', trend, }) {
    const accentKey = getAccentKey(`${iconColor} ${iconBgColor}`);
    const accent = ACCENT_STYLES[accentKey] || ACCENT_STYLES.blue;
    return (<Card className={accent.card}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {trend && (<p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>)}
          </div>
          <div className={`w-12 h-12 rounded-lg ${iconBgColor} ${accent.iconWrap} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor} ${accent.icon}`}/>
          </div>
        </div>
      </CardContent>
    </Card>);
}
