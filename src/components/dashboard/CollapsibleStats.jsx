import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, BarChart3, Calendar, Clock, Users, TrendingUp } from "lucide-react";
import StatsOverview from "./StatsOverview";

export default function CollapsibleStats({ stats }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="meetiz-card">
                <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer">
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                סקירה כללית
                            </CardTitle>
                            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        {!isOpen && (
                            <p className="text-sm text-slate-500 pt-2 text-right">
                                הצג נתונים סטטיסטיים על כלל הישיבות
                            </p>
                        )}
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <StatsOverview
                                title="סה״כ ישיבות"
                                value={stats.totalMeetings}
                                icon={Calendar}
                                color="blue"
                            />
                            <StatsOverview
                                title="ישיבות פעילות"
                                value={stats.activeMeetings}
                                icon={Clock}
                                color="orange"
                            />
                            <StatsOverview
                                title="ישיבות מאושרות"
                                value={stats.confirmedMeetings}
                                icon={Users}
                                color="green"
                            />
                            <StatsOverview
                                title="ישיבות שבוצעו"
                                value={stats.pastMeetings}
                                icon={TrendingUp}
                                color="purple"
                            />
                             <StatsOverview
                                title="תגובות התקבלו"
                                value={stats.totalResponses}
                                icon={TrendingUp}
                                color="indigo"
                            />
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}