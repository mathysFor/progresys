"use client";

export default function StatsCard({ title, value, subtitle, icon, color = "teal" }) {
  const colorClasses = {
    teal: "from-teal-500 to-cyan-500 shadow-teal-500/30",
    blue: "from-blue-500 to-indigo-500 shadow-blue-500/30",
    purple: "from-purple-500 to-pink-500 shadow-purple-500/30",
    orange: "from-orange-500 to-amber-500 shadow-orange-500/30",
    green: "from-emerald-500 to-green-500 shadow-emerald-500/30",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

