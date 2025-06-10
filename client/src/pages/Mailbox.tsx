import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  RefreshCw,
  Mail,
  Star,
  FileText,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Calendar,
  CalendarPlus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClassifiedEmail, GmailRawData } from "@/types/email";
import { supabase } from "@/lib/supabase";
import EmailDetailModal from "@/components/EmailDetailModal";

type EmailCategory = 'all' | '협찬메일' | '일반메일';

export default function Mailbox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory>('all');
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ClassifiedEmail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { toast } = useToast();

  // 사용자 로그인 상태 확인
  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user && session.provider_token) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || null);
      } else {
        setIsLoggedIn(false);
        setUserEmail(null);
      }
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      setIsLoggedIn(false);
      setUserEmail(null);
    }
  };

  const loadEmails = () => {
    try {
      setLoading(true);
      
      // 1. 분류된 메일 데이터 로드
      const classifiedData = localStorage.getItem('gmail_classified_emails');
      
      // 2. Gmail 원본 데이터 로드 (시간 정보 포함)
      const rawGmailData = localStorage.getItem('gmail_emails_auto_sync') || 
                          localStorage.getItem('gmail_emails_from_supabase');
      
      if (classifiedData) {
        const classifiedEmails = JSON.parse(classifiedData);
        let enrichedEmails = classifiedEmails;
        
        // Gmail 원본 데이터가 있으면 시간 정보와 발신자 정보를 매칭
        if (rawGmailData) {
          const rawEmails: GmailRawData[] = JSON.parse(rawGmailData);
          console.log('원본 Gmail 데이터:', rawEmails.length, '개');
          console.log('분류된 메일 데이터:', classifiedEmails.length, '개');
          
          enrichedEmails = classifiedEmails.map((classifiedEmail: any) => {
            // mail_id로 원본 데이터 찾기
            const rawEmail = rawEmails.find(raw => 
              raw.id === classifiedEmail.mail_id || 
              raw.thread_id === classifiedEmail.mail_id
            );
            
            if (rawEmail) {
              console.log(`매칭 성공: ${classifiedEmail.mail_id}`);
              return {
                ...classifiedEmail,
                received_at: rawEmail.received_at,
                created_at: rawEmail.created_at,
                sender: rawEmail.sender,
                thread_id: rawEmail.thread_id,
                plain_text: rawEmail.plain_text // 메일 전체 내용 추가
              };
            } else {
              console.log(`매칭 실패: ${classifiedEmail.mail_id}`);
              return {
                ...classifiedEmail,
                received_at: new Date().toISOString(), // 기본값
                sender: '발신자 정보 없음'
              };
            }
          });
        }
        
        // 유효한 이메일 데이터만 필터링
        const validEmails = enrichedEmails.filter((email: any) => 
          email && 
          email.mail_id && 
          email.subject && 
          email.mail_type && 
          email.summary
        );
        
        console.log('최종 처리된 메일:', validEmails.length, '개');
        setEmails(validEmails);
      } else {
        setEmails([]);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast({
        title: "오류",
        description: "메일을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
      setEmails([]);
    } finally {
      setLoading(false);
    }
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

  const refreshEmails = async () => {
    try {
      setRefreshing(true);
      
      toast({
        title: "동기화 시작",
        description: "Gmail 메일을 동기화하고 AI 분류를 진행합니다...",
      });

      // 3단계 동기화 프로세스
      // 1단계: Gmail 동기화
      await performGmailSync();
      
      // 2단계: AI 분류
      await performAIClassification();
      
      // 3단계: 데이터 로딩
      loadEmails();
      
      toast({
        title: "동기화 완료! ✅",
        description: "메일 동기화와 AI 분류가 완료되었습니다.",
      });
      
    } catch (error) {
      console.error('Refresh failed:', error);
      toast({
        title: "동기화 실패",
        description: "메일 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const performGmailSync = async () => {
    try {
      // Supabase 세션에서 access_token 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) {
        throw new Error('Gmail 토큰이 없습니다. 설정 페이지에서 Google 로그인을 먼저 해주세요.');
      }

      const response = await fetch('https://n8n.1000.school/webhook/gmail-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          access_token: token
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gmail 동기화 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Gmail 동기화 성공:', result);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('gmail_emails_auto_sync', JSON.stringify(result.emails || []));
      
    } catch (error) {
      console.error('Gmail 동기화 오류:', error);
      throw error;
    }
  };

  const performAIClassification = async () => {
    try {
      // n8n 워크플로우 호출
      const response = await fetch('https://n8n.1000.school/webhook/gmail-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual_refresh',
          source: 'mailbox_refresh',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI 분류 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('AI 분류 성공:', result);
      
      // 분류 결과 저장
      if (result.length > 0 && result[0].output) {
        const classifiedEmails = result[0].output;
        localStorage.setItem('gmail_classified_emails', JSON.stringify(classifiedEmails));
        console.log('분류된 메일 저장:', classifiedEmails.length, '개');
      }
      
    } catch (error) {
      console.error('AI 분류 오류:', error);
      throw error;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
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

  // 컴포넌트 마운트 시 인증 상태 확인 및 메일 로드
  useEffect(() => {
    checkAuthStatus();
    loadEmails();

    // 로컬 스토리지 변경 감지 (다른 탭에서 데이터 업데이트 시)
    const handleStorageChange = () => {
      loadEmails();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getEmailStats = () => {
    const total = emails.length;
    const sponsorship = emails.filter(email => email.mail_type === '협찬메일').length;
    const regular = emails.filter(email => email.mail_type === '일반메일').length;
    
    // 최근 7일 메일
    const recentEmails = emails.filter(email => {
      if (!email.received_at) return false;
      const emailDate = new Date(email.received_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return emailDate >= weekAgo;
    });

    // 오늘 받은 메일
    const todayEmails = emails.filter(email => {
      if (!email.received_at) return false;
      const emailDate = new Date(email.received_at);
      const today = new Date();
      return emailDate.toDateString() === today.toDateString();
    });

    return { total, sponsorship, regular, recent: recentEmails.length, today: todayEmails.length };
  };

  // 필터링된 이메일 계산
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSenderName(email.sender).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (email.plain_text && email.plain_text.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || email.mail_type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const stats = getEmailStats();

  const getMailTypeBadgeStyle = (mailType: string) => {
    switch (mailType) {
      case '협찬메일':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '일반메일':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">메일함</h1>
          <p className="text-gray-600 mt-1">AI로 분류된 메일을 확인하세요</p>
          {/* 로그인 상태 표시 */}
          <div className="flex items-center gap-2 mt-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  연결됨: {userEmail}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600 font-medium">
                  Gmail 연결 필요 - 설정 페이지에서 Google 로그인해주세요
                </span>
              </div>
            )}
          </div>
        </div>
        <Button
          onClick={refreshEmails}
          disabled={refreshing || !isLoggedIn}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          메일 새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">총 메일</p>
                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-600 font-medium">협찬 메일</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.sponsorship}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">일반 메일</p>
                <p className="text-2xl font-bold text-green-700">{stats.regular}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">최근 7일</p>
                <p className="text-2xl font-bold text-purple-700">{stats.recent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarPlus className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">오늘 받은 메일</p>
                <p className="text-2xl font-bold text-orange-700">{stats.today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="메일 제목, 발신자, 내용으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            className="whitespace-nowrap"
          >
            전체 ({stats.total})
          </Button>
          <Button
            variant={selectedCategory === '협찬메일' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('협찬메일')}
            className="whitespace-nowrap bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
          >
            💰 협찬 메일 ({stats.sponsorship})
          </Button>
          <Button
            variant={selectedCategory === '일반메일' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('일반메일')}
            className="whitespace-nowrap"
          >
            일반 메일 ({stats.regular})
          </Button>
        </div>
      </div>

      {/* 메일 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            메일 목록 ({filteredEmails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoggedIn ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Gmail 연결이 필요합니다</h3>
              <p className="text-gray-500 mb-4">
                메일을 확인하려면 설정 페이지에서 Google 계정을 연결해주세요.
              </p>
              <Button 
                onClick={() => window.location.href = '/settings'} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                설정 페이지로 이동
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">메일을 불러오는 중...</span>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">메일이 없습니다</h3>
              <p className="text-gray-500 mb-4">
                {emails.length === 0 
                  ? '새로고침 버튼을 눌러 메일을 동기화해보세요.' 
                  : '검색 조건에 맞는 메일이 없습니다.'}
              </p>
              {emails.length === 0 && (
                <Button onClick={refreshEmails} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  메일 새로고침
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEmails.map((email) => (
                <div
                  key={email.mail_id}
                  onClick={() => handleEmailClick(email)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          className={`text-xs ${getMailTypeBadgeStyle(email.mail_type)}`}
                        >
                          {email.mail_type === '협찬메일' && <Star className="w-3 h-3 mr-1" />}
                          {email.mail_type === '일반메일' && <FileText className="w-3 h-3 mr-1" />}
                          {email.mail_type}
                        </Badge>
                        {email.mail_type === '협찬메일' && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200 animate-pulse">
                            💰 수익 기회
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {email.subject}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{getSenderName(email.sender)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(email.received_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {email.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메일 상세 모달 */}
      <EmailDetailModal
        email={selectedEmail}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
