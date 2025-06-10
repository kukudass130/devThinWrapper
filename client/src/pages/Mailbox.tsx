import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  RefreshCw,
  Mail,
  Info,
  Megaphone,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ClassifiedEmail } from "@/types/email";

type EmailCategory = 'all' | '정보성' | '광고성';

export default function Mailbox() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EmailCategory>('all');
  const [emails, setEmails] = useState<ClassifiedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadEmails = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('gmail_classified_emails');
      if (stored) {
        const parsedEmails = JSON.parse(stored);
        // 유효한 이메일 데이터만 필터링
        const validEmails = parsedEmails.filter((email: any) => 
          email && 
          email.mail_id && 
          email.subject && 
          email.mail_type && 
          email.summary
        );
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
      setEmails([]); // 오류 시 빈 배열로 설정
    } finally {
      setLoading(false);
    }
  };

  const refreshEmails = async () => {
    toast({
      title: "새로고침",
      description: "Settings 페이지에서 '메일 분류 및 요약'을 실행하여 최신 메일을 가져오세요.",
    });
    loadEmails();
  };

  useEffect(() => {
    loadEmails();
    
    // 로컬스토리지 변경 감지
    const handleStorageChange = () => {
      loadEmails();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getEmailStats = () => {
    const stats = {
      정보성: emails.filter(email => email.mail_type === '정보성').length,
      광고성: emails.filter(email => email.mail_type === '광고성').length,
      전체: emails.length,
    };
    return stats;
  };

  const emailStats = getEmailStats();

  const categoryStats = [
    {
      id: 'all' as EmailCategory,
      name: '전체',
      count: emailStats.전체,
      icon: Mail,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      id: '정보성' as EmailCategory,
      name: '정보성',
      count: emailStats.정보성,
      icon: Info,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      id: '광고성' as EmailCategory,
      name: '광고성',
      count: emailStats.광고성,
      icon: Megaphone,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  const filteredEmails = selectedCategory === 'all' 
    ? emails.filter(email =>
        email.subject && email.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : emails.filter(email =>
        email.mail_type === selectedCategory &&
        email.subject && email.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">메일함</h1>
        <p className="text-gray-600 mt-2">협찬 메일을 관리하세요</p>
      </div>

      {/* Email Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categoryStats.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCategory === category.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                    <IconComponent className={`w-5 h-5 ${category.iconColor}`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {category.count}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {category.name}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="메일 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={refreshEmails}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategory === 'all' ? '모든 메일' :
             selectedCategory === '정보성' ? '정보성 메일' :
             selectedCategory === '광고성' ? '광고성 메일' :
             '중요한 메일'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredEmails.length > 0 ? (
            <div className="space-y-4">
              {filteredEmails.map((email) => (
                <div
                  key={email.mail_id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={email.mail_type === '정보성' ? 'default' : 'secondary'}
                          className={email.mail_type === '정보성' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                        >
                          {email.mail_type}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {email.subject || '제목 없음'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {email.summary || '요약 없음'}
                      </p>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">분류 이유:</span> {email.classification_reason || '분류 이유 없음'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? '검색 결과가 없습니다' : '메일이 없습니다'}
              </p>
              {emails.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">
                  Settings 페이지에서 '메일 분류 및 요약'을 실행하여 메일을 불러오세요
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
