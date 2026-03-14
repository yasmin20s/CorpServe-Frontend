import { Card, CardContent } from './ui/card';
export default function StatsCard({ title, value, icon: Icon, iconColor = 'text-blue-600', iconBgColor = 'bg-blue-100', trend, }) {
    return (<Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
            {trend && (<p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </p>)}
          </div>
          <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`}/>
          </div>
        </div>
      </CardContent>
    </Card>);
}
