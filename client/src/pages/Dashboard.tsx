import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Handshake, CalendarCheck, DollarSign, ArrowRight, TrendingUp, Filter, AlertCircle } from "lucide-react";
import SponsorshipChart from "@/components/SponsorshipChart";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { ClassifiedEmail } from "@/types/email";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [classifiedEmails, setClassifiedEmails] = useState<ClassifiedEmail[]>([]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/calendar/upcoming"],
  });

  const { data: importantEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ["/api/emails", { category: "important" }],
  });

  // Load classified emails from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gmail_classified_emails');
    if (stored) {
      try {
        const emails = JSON.parse(stored);
        // 유효한 이메일 데이터만 필터링
        const validEmails = emails.filter((email: any) => 
          email && 
          email.mail_id && 
          email.subject && 
          email.mail_type && 
          email.summary
        );
        setClassifiedEmails(validEmails);
      } catch (error) {
        console.error('Failed to parse stored emails:', error);
        setClassifiedEmails([]);
      }
    }
  }, []);

  // Handle unauthorized errors
  useEffect(() => {
    if (statsError && isUnauthorizedError(statsError)) {
      toast({
        title: "인증 필요",
        description: "다시 로그인해주세요.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [statsError, toast]);

  if (statsLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">오늘의 활동 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setLocation("/mailbox")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">새 메일</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.newEmails || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              오늘 +3개
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setLocation("/calendar")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">이번달 협찬</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.monthlySponsors || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Handshake className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              지난달 +15%
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setLocation("/calendar")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">예정된 일정</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.scheduledEvents || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">이번 주</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setLocation("/calendar")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">이번달 수익</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₩{(stats?.monthlyRevenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              전월 대비 +22%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gmail Classification Stats */}
      {classifiedEmails.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Gmail 분류 현황
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/mailbox")}
            >
              전체보기 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {classifiedEmails.length}
                </div>
                <div className="text-sm text-gray-600">총 메일</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {classifiedEmails.filter(e => e.mail_type === '정보성').length}
                </div>
                <div className="text-sm text-gray-600">정보성</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {classifiedEmails.filter(e => e.mail_type === '광고성').length}
                </div>
                <div className="text-sm text-gray-600">광고성</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((classifiedEmails.filter(e => e.mail_type === '정보성').length / classifiedEmails.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">정보성 비율</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">최근 분류된 메일</h4>
              {classifiedEmails.slice(0, 3).map((email) => (
                <div key={email.mail_id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <Badge 
                    variant={email.mail_type === '정보성' ? 'default' : 'secondary'}
                    className={email.mail_type === '정보성' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                  >
                    {email.mail_type}
                  </Badge>
                                     <div className="flex-1 min-w-0">
                     <p className="text-sm font-medium text-gray-900 truncate">
                       {email.subject || '제목 없음'}
                     </p>
                     <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                       {email.summary || '요약 없음'}
                     </p>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Important Emails */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">중요한 메일</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLocation("/mailbox")}
              >
                전체보기 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {emailsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : importantEmails && importantEmails.length > 0 ? (
                <div className="space-y-4">
                  {importantEmails.slice(0, 3).map((email: any) => (
                    <div key={email.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {email.subject}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {email.senderName}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(email.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  중요한 메일이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sponsorship Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>협찬 제의 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <SponsorshipChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">다가오는 일정</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/calendar")}
          >
            전체보기 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-500">
                      {new Date(event.startDate).toLocaleDateString('ko-KR', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {new Date(event.startDate).getDate()}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(event.endDate).toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {event.location && ` | ${event.location}`}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {event.status === 'scheduled' ? '진행예정' : 
                       event.status === 'completed' ? '완료' : '취소됨'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">
              예정된 일정이 없습니다
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
