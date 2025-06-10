import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertCircle, Info, Megaphone } from "lucide-react";

interface GmailEmail {
  mail_id: string;
  subject: string;
  mail_type: string;
  classification_reason: string;
  summary: string;
}

interface GmailEmailCardProps {
  email: GmailEmail;
}

export default function GmailEmailCard({ email }: GmailEmailCardProps) {
  const getTypeInfo = (type: string) => {
    switch (type) {
      case '정보성':
        return { 
          label: '정보성', 
          color: 'bg-blue-100 text-blue-800',
          icon: Info
        };
      case '광고성':
        return { 
          label: '광고성', 
          color: 'bg-orange-100 text-orange-800',
          icon: Megaphone
        };
      case '중요':
        return { 
          label: '중요', 
          color: 'bg-red-100 text-red-800',
          icon: AlertCircle
        };
      default:
        return { 
          label: type, 
          color: 'bg-gray-100 text-gray-800',
          icon: Mail
        };
    }
  };

  const typeInfo = getTypeInfo(email.mail_type);
  const IconComponent = typeInfo.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-6 h-6 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 truncate">{email.subject}</h4>
              <Badge className={typeInfo.color}>
                {typeInfo.label}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{email.summary}</p>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">분류 이유</p>
              <p className="text-sm text-gray-700">{email.classification_reason}</p>
            </div>
            
            <div className="mt-3 text-xs text-gray-400">
              메일 ID: {email.mail_id}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}