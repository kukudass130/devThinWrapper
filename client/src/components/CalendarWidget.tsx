import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  eventType: string;
}

interface CalendarWidgetProps {
  currentDate: Date;
  events: CalendarEvent[];
  isLoading: boolean;
}

export default function CalendarWidget({ currentDate, events, isLoading }: CalendarWidgetProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: prevMonthDay,
      });
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate,
      });
    }
    
    // Add empty cells for days after the last day of the month
    const totalCells = 42; // 6 rows × 7 days
    const remainingCells = totalCells - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: nextMonthDay,
      });
    }
    
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventColor = (eventType: string, status: string) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'cancelled') return 'bg-gray-500';
    
    switch (eventType) {
      case 'shooting':
        return 'bg-blue-500';
      case 'meeting':
        return 'bg-purple-500';
      case 'content':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day.fullDate);
          const isToday = day.fullDate.toDateString() === today.toDateString();
          
          return (
            <div
              key={index}
              className={`
                aspect-square p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                ${!day.isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''}
                ${isToday ? 'bg-primary text-white hover:bg-primary/90' : ''}
              `}
            >
              <div className="h-full flex flex-col">
                <span className={`text-sm font-medium ${isToday ? 'text-white' : ''}`}>
                  {day.date}
                </span>
                
                {dayEvents.length > 0 && (
                  <div className="flex-1 flex flex-col gap-1 mt-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`
                          w-full h-1 rounded-full
                          ${getEventColor(event.eventType, event.status)}
                        `}
                        title={event.title}
                      ></div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-xs text-gray-500">
                        +{dayEvents.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">촬영</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">미팅</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">콘텐츠</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">완료</span>
        </div>
      </div>
    </div>
  );
}
