// 메일 데이터 타입 정의
export interface ClassifiedEmail {
  mail_id: string;
  subject: string;
  mail_type: "협찬메일" | "일반메일";
  classification_reason: string;
  summary: string;
  received_at?: string; // 메일 수신 시간
  created_at?: string; // 시스템 생성 시간
  sender?: string; // 발신자 정보
  thread_id?: string; // 스레드 ID
  plain_text?: string; // 메일 전체 내용
}

// Gmail 원본 데이터 타입 (Supabase에서 가져오는 데이터)
export interface GmailRawData {
  id: string;
  thread_id: string;
  subject: string;
  sender: string;
  received_at: string;
  created_at: string;
  plain_text?: string;
}

// API 응답 타입
export interface GmailFilterResponse {
  output: ClassifiedEmail[];
}

// 메일 통계 타입
export interface EmailStats {
  total: number;
  sponsor: number;
  regular: number;
  sponsorRatio: number;
} 