import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, DollarSign, Calendar, Check, X } from "lucide-react";

interface EmailCardProps {
  email: {
    id: number;
    subject: string;
    content: string;
    senderName: string;
    senderEmail: string;
    category: string;
    sponsorshipAmount?: number;
    deadline?: string;
    aiSummary?: string;
    isRead: boolean;
    createdAt: string;
  };
  onAction: (emailId: number, action: 'accept' | 'reject') => void;
  isUpdating: boolean;
}

export default function EmailCard({ email, onAction, isUpdating }: EmailCardProps) {
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'pending':
        return { label: '대기중', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'important':
        return { label: '중요', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      case 'accepted':
        return { label: '수락됨', variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { label: '거절됨', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' };
      default:
        return { label: category, variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const categoryInfo = getCategoryInfo(email.category);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 truncate">{email.subject}</h4>
              <Badge className={categoryInfo.color}>
                {categoryInfo.label}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">{email.senderName}</p>
            <p className="text-gray-600 mb-3 line-clamp-2">{email.content}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {email.sponsorshipAmount && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>₩{email.sponsorshipAmount.toLocaleString()}</span>
                </div>
              )}
              {email.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(email.deadline).toLocaleDateString('ko-KR')}</span>
                </div>
              )}
              <span>{new Date(email.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            
            {email.aiSummary && (
              <div className="p-3 bg-blue-50 rounded-lg mb-3">
                <p className="text-sm text-blue-800">
                  <strong>AI 요약:</strong> {email.aiSummary}
                </p>
              </div>
            )}
          </div>
          
          {email.category === 'pending' && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <Button
                size="sm"
                onClick={() => onAction(email.id, 'accept')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                수락
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction(email.id, 'reject')}
                disabled={isUpdating}
              >
                <X className="w-4 h-4 mr-1" />
                거절
              </Button>
            </div>
          )}
          
          {email.category === 'accepted' && (
            <div className="text-green-600 flex-shrink-0">
              <Check className="w-6 h-6" />
            </div>
          )}
          
          {email.category === 'rejected' && (
            <div className="text-gray-400 flex-shrink-0">
              <X className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
