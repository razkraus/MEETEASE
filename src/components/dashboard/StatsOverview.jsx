import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const colorClasses = {
  blue: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    light: "bg-blue-50"
  },
  green: {
    bg: "bg-green-500",
    text: "text-green-500",
    light: "bg-green-50"
  },
  orange: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    light: "bg-orange-50"
  },
  purple: {
    bg: "bg-purple-500",
    text: "text-purple-500",
    light: "bg-purple-50"
  },
  indigo: {
    bg: "bg-indigo-500",
    text: "text-indigo-500",
    light: "bg-indigo-50"
  }
};

export default function StatsOverview({ title, value, icon: Icon, color, trend }) {
  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card className="meetiz-card relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${colors.bg} rounded-full opacity-10`} />
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
            {value}
          </CardTitle>
        </div>
        <div className={`p-3 rounded-xl ${colors.light}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </CardHeader>
      {trend && (
        <CardContent className="pt-0">
          <p className="text-xs text-slate-500">{trend}</p>
        </CardContent>
      )}
    </Card>
  );
}