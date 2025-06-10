import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import CalendarWidget from "@/components/CalendarWidget";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/revenue/monthly"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/calendar/events", {
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
    }],
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">캘린더</h1>
        <p className="text-gray-600 mt-2">일정과 수익 현황을 확인하세요</p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CalendarWidget 
            currentDate={currentDate}
            events={events || []}
            isLoading={eventsLoading}
          />
        </CardContent>
      </Card>

      {/* Revenue Status and Performance Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Status */}
        <Card>
          <CardHeader>
            <CardTitle>수익 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="space-y-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">이번달 총 수익</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₩{(monthlyRevenue?.total || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-green-600 text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {monthlyRevenue?.growth ? `+${monthlyRevenue.growth.toFixed(1)}%` : '0%'}
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((monthlyRevenue?.total || 0) / 5000000 * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  목표 대비 {Math.min((monthlyRevenue?.total || 0) / 5000000 * 100, 100).toFixed(0)}% 달성
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>이번달 실적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">완료된 협찬</span>
                <span className="text-sm font-medium text-gray-900">
                  {events?.filter((e: any) => e.status === 'completed').length || 0}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">진행중인 협찬</span>
                <span className="text-sm font-medium text-gray-900">
                  {events?.filter((e: any) => e.status === 'scheduled').length || 0}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">예정된 협찬</span>
                <span className="text-sm font-medium text-gray-900">
                  {events?.filter((e: any) => new Date(e.startDate) > new Date()).length || 0}건
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">총 협찬</span>
                <span className="text-sm font-bold text-primary">
                  {events?.length || 0}건
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
