import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

export default function MeetingFilters({ selectedStatus, onStatusChange }) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-500" />
      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-40 rounded-xl">
          <SelectValue placeholder="סטטוס" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">כל הסטטוסים</SelectItem>
          <SelectItem value="draft">טיוטות</SelectItem>
          <SelectItem value="sent">נשלחו</SelectItem>
          <SelectItem value="confirmed">מאושרות</SelectItem>
          <SelectItem value="cancelled">בוטלו</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}