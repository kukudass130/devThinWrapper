import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, Star, Users, Camera, FileVideo } from "lucide-react";
import CalendarWidget from "@/components/CalendarWidget";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'sponsorship' | 'meeting' | 'general';
  category?: '촬영' | '미팅' | '콘텐츠';
  emailId?: string;
  senderName?: string;
  senderEmail?: string;
  createdAt: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // 로컬 스토리지에서 일정 로드
  const loadEvents = () => {
    try {
      setLoading(true);
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        console.log('캘린더 일정 로드:', parsedEvents.length, '개');
        setEvents(parsedEvents);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('일정 로드 실패:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    
    // 로컬 스토리지 변경 감지 (다른 탭에서 일정이 추가된 경우)
    const handleStorageChange = () => {
      loadEvents();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 현재 월의 일정 필터링
  const getCurrentMonthEvents = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  };

  const currentMonthEvents = getCurrentMonthEvents();

  // 수익 계산 (임시 데이터)
  const calculateRevenue = () => {
    const completedEvents = events.filter(e => e.status === 'completed');
    // 간단한 수익 계산 (실제로는 더 복잡한 로직이 필요)
    const total = completedEvents.length * 500000; // 협찬당 50만원 가정
    return {
      total,
      growth: 15.2 // 임시 성장률
    };
  };

  const monthlyRevenue = calculateRevenue();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case '촬영': return Camera;
      case '미팅': return Users;
      case '콘텐츠': return FileVideo;
      default: return CalendarIcon;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case '촬영': return 'text-red-600 bg-red-100';
      case '미팅': return 'text-blue-600 bg-blue-100';
      case '콘텐츠': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
            events={currentMonthEvents.map(event => ({
              id: parseInt(event.id.split('_')[1]) || Math.random(),
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              status: event.status,
              eventType: event.category === '촬영' ? 'shooting' : 
                        event.category === '미팅' ? 'meeting' : 
                        event.category === '콘텐츠' ? 'content' : 'general'
            }))}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      {/* Recent Events */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              최근 협찬 일정 ({events.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((event) => {
                  const IconComponent = getCategoryIcon(event.category);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(event.category)}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(event.startDate).toLocaleDateString('ko-KR', {
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status === 'scheduled' ? '예정됨' :
                           event.status === 'completed' ? '완료됨' : '취소됨'}
                        </div>
                        {event.category && (
                          <div className="text-xs text-gray-500 mt-1">
                            {event.category}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>등록된 일정이 없습니다.</p>
                  <p className="text-xs mt-1">메일함에서 협찬을 수락하면 일정이 자동으로 추가됩니다.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Status and Performance Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Status */}
        <Card>
          <CardHeader>
            <CardTitle>수익 현황</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
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
                      ₩{monthlyRevenue.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-green-600 text-sm font-medium flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +{monthlyRevenue.growth}%
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(monthlyRevenue.total / 5000000 * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  목표 대비 {Math.min(monthlyRevenue.total / 5000000 * 100, 100).toFixed(0)}% 달성
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
                  {events.filter(e => e.status === 'completed').length}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">진행중인 협찬</span>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => e.status === 'scheduled').length}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">예정된 협찬</span>
                <span className="text-sm font-medium text-gray-900">
                  {events.filter(e => new Date(e.startDate) > new Date()).length}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">촬영 일정</span>
                <span className="text-sm font-medium text-red-600">
                  {events.filter(e => e.category === '촬영').length}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">미팅 일정</span>
                <span className="text-sm font-medium text-blue-600">
                  {events.filter(e => e.category === '미팅').length}건
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">콘텐츠 일정</span>
                <span className="text-sm font-medium text-green-600">
                  {events.filter(e => e.category === '콘텐츠').length}건
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-900">총 협찬</span>
                <span className="text-sm font-bold text-primary">
                  {events.length}건
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
