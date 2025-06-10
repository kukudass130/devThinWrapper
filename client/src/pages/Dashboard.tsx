import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Mail, 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign,
  FileText,
  Clock,
  Calendar,
  Target
} from "lucide-react";
import { ClassifiedEmail } from "@/types/email";
import EmailDetailModal from "@/components/EmailDetailModal";

interface EmailStats {
  total: number;
  sponsor: number;
  regular: number;
  sponsorRatio: number;
  recentEmails: number; // 최근 7일 내 메일
  todayEmails: number; // 오늘 받은 메일
}

interface StatCard {
  title: string;
  value: number | string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [emailStats, setEmailStats] = useState<EmailStats>({
    total: 0,
    sponsor: 0,
    regular: 0,
    sponsorRatio: 0,
    recentEmails: 0,
    todayEmails: 0
  });
  const [recentSponsors, setRecentSponsors] = useState<ClassifiedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ClassifiedEmail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadEmailData();
  }, []);

  const loadEmailData = () => {
    try {
      // 분류된 메일 데이터 로드
      const classifiedData = localStorage.getItem('gmail_classified_emails');
      
      // Gmail 원본 데이터 로드 (시간 정보 포함)
      const rawGmailData = localStorage.getItem('gmail_emails_auto_sync') || 
                          localStorage.getItem('gmail_emails_from_supabase');
      
      if (classifiedData) {
        const classifiedEmails = JSON.parse(classifiedData);
        let enrichedEmails = classifiedEmails;
        
        // Gmail 원본 데이터가 있으면 시간 정보를 매칭
        if (rawGmailData) {
          const rawEmails = JSON.parse(rawGmailData);
          
          enrichedEmails = classifiedEmails.map((classifiedEmail: any) => {
            const rawEmail = rawEmails.find((raw: any) => 
              raw.id === classifiedEmail.mail_id || 
              raw.thread_id === classifiedEmail.mail_id
            );
            
            if (rawEmail) {
              return {
                ...classifiedEmail,
                received_at: rawEmail.received_at,
                sender: rawEmail.sender
              };
            }
            return classifiedEmail;
          });
        }

        const validEmails: ClassifiedEmail[] = enrichedEmails.filter((email: any) => 
          email && email.mail_id && email.subject && email.mail_type && email.summary
        );

        // 날짜 기반 필터링
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const todayEmails = validEmails.filter(email => {
          if (!email.received_at) return false;
          const emailDate = new Date(email.received_at);
          return emailDate >= today;
        });

        const recentEmails = validEmails.filter(email => {
          if (!email.received_at) return false;
          const emailDate = new Date(email.received_at);
          return emailDate >= weekAgo;
        });

        const sponsorEmails = validEmails.filter(email => email.mail_type === '협찬메일');
        const regularEmails = validEmails.filter(email => email.mail_type === '일반메일');

        const sponsorRatio = validEmails.length > 0 ? (sponsorEmails.length / validEmails.length) * 100 : 0;

        setEmailStats({
          total: validEmails.length,
          sponsor: sponsorEmails.length,
          regular: regularEmails.length,
          sponsorRatio: Math.round(sponsorRatio * 10) / 10,
          recentEmails: recentEmails.length,
          todayEmails: todayEmails.length
        });

        // 최근 협찬 메일 (최대 5개, 수신 시간순 정렬)
        const recentSponsorEmails = sponsorEmails
          .filter(email => email.received_at)
          .sort((a, b) => new Date(b.received_at!).getTime() - new Date(a.received_at!).getTime())
          .slice(0, 5);

        setRecentSponsors(recentSponsorEmails);
      }
    } catch (error) {
      console.error('Failed to load email data:', error);
    }
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '시간 정보 없음';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else {
      return `${diffDays}일 전`;
    }
  };

  const getSenderName = (sender?: string) => {
    if (!sender) return '발신자 정보 없음';
    
    // "Name <email@domain.com>" 형태에서 이름만 추출
    const match = sender.match(/^"?([^"<]+)"?\s*<.*>$/);
    if (match) {
      return match[1].trim();
    }
    if (sender.includes('@')) {
      return sender.split('@')[0];
    }
    return sender;
  };

  const getSponsorRatioColor = (ratio: number) => {
    if (ratio >= 30) return 'text-green-600';
    if (ratio >= 20) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getSponsorRatioBgColor = (ratio: number) => {
    if (ratio >= 30) return 'bg-green-100';
    if (ratio >= 20) return 'bg-yellow-100';
    return 'bg-blue-100';
  };

  // 메일 카드 클릭 핸들러
  const handleEmailClick = (email: ClassifiedEmail) => {
    setSelectedEmail(email);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEmail(null);
  };

  // 통계 카드 클릭 핸들러
  const handleStatCardClick = (type: 'total' | 'today' | 'recent') => {
    setLocation('/mailbox');
  };

  const mainStatCards: StatCard[] = [
    {
      title: "총 메일 수",
      value: emailStats.total,
      description: "분석된 전체 메일",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "협찬 비율",
      value: `${emailStats.sponsorRatio}%`,
      description: emailStats.sponsorRatio >= 30 ? "높은 협찬 기회!" : "협찬 메일 비율",
      icon: Target,
      color: getSponsorRatioColor(emailStats.sponsorRatio),
      bgColor: getSponsorRatioBgColor(emailStats.sponsorRatio)
    }
  ];

  const timeStatCards: StatCard[] = [
    {
      title: "오늘 받은 메일",
      value: emailStats.todayEmails,
      description: "24시간 내 수신",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "최근 7일 메일",
      value: emailStats.recentEmails,
      description: "최근 활동량",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">인플루언서 메일 관리 현황을 한눈에 확인하세요</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mainStatCards.map((stat, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden ${
              stat.title === "총 메일 수" ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
            }`}
            onClick={stat.title === "총 메일 수" ? () => handleStatCardClick('total') : undefined}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              {stat.title === "협찬 비율" && emailStats.sponsorRatio > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        emailStats.sponsorRatio >= 30 ? 'bg-green-500' :
                        emailStats.sponsorRatio >= 20 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(emailStats.sponsorRatio, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
            {stat.title === "협찬 비율" && emailStats.sponsorRatio >= 30 && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Time-based Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {timeStatCards.map((stat, index) => (
          <Card 
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleStatCardClick(stat.title === "오늘 받은 메일" ? 'today' : 'recent')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">{stat.title}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email Classification Summary */}
      {emailStats.total > 0 && (
        <Card className={`border-2 ${
          emailStats.sponsorRatio >= 30 ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50' :
          emailStats.sponsorRatio >= 20 ? 'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50' :
          'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${getSponsorRatioColor(emailStats.sponsorRatio)}`}>
              <BarChart3 className="w-5 h-5" />
              협찬 메일 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">분석된 총 메일 수</span>
                <Badge variant="outline" className="text-blue-700 border-blue-200">
                  {emailStats.total}개
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">협찬 메일 발견</span>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  {emailStats.sponsor}개 🎯
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">일반 메일</span>
                <Badge variant="outline" className="text-gray-700 border-gray-200">
                  {emailStats.regular}개
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">협찬 비율</span>
                <Badge className={`${getSponsorRatioBgColor(emailStats.sponsorRatio)} ${getSponsorRatioColor(emailStats.sponsorRatio)} border-0`}>
                  {emailStats.sponsorRatio}% {emailStats.sponsorRatio >= 30 && '🚀'}
                </Badge>
              </div>
              
              {emailStats.sponsorRatio >= 30 && (
                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    🎉 높은 협찬 기회! 30% 이상의 메일이 브랜드 협찬 관련입니다.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sponsor Emails */}
      {recentSponsors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <DollarSign className="w-5 h-5" />
              최근 협찬 메일 ({recentSponsors.length}개)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSponsors.map((email) => (
                <div 
                  key={email.mail_id} 
                  className="border border-yellow-200 rounded-lg p-4 bg-yellow-50/30 cursor-pointer hover:bg-yellow-100/50 transition-colors"
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {email.subject}
                      </h4>
                      <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                        <span>📧 {getSenderName(email.sender)}</span>
                        <span>⏰ {formatRelativeTime(email.received_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {email.summary}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">분류 이유:</span> {email.classification_reason}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 ml-4">
                      💰 협찬
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {emailStats.total === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              메일 데이터가 없습니다
            </h3>
            <p className="text-gray-500 mb-6">
              Mailbox에서 Gmail 동기화를 진행하거나 Settings에서 Google 로그인을 확인하세요.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>💡 Gmail 동기화 → AI 분류 → 협찬 메일 발견</p>
              <p>📊 분석 결과가 이곳에 표시됩니다</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메일 상세 모달 */}
      <EmailDetailModal
        email={selectedEmail}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
