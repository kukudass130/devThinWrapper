// 메일 데이터 타입 정의
export interface ClassifiedEmail {
  mail_id: string;
  subject: string;
  mail_type: "정보성" | "광고성";
  classification_reason: string;
  summary: string;
}

// API 응답 타입
export interface GmailFilterResponse {
  output: ClassifiedEmail[];
}

// 메일 통계 타입
export interface EmailStats {
  total: number;
  informational: number;
  promotional: number;
} 