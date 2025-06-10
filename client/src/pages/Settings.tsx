import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  FileText, 
  LogOut,
  Settings as SettingsIcon,
  Mail,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Copy
} from "lucide-react";
import { signInWithGoogle, supabase } from "@/lib/supabase";
import { ClassifiedEmail } from "@/types/email";

export default function Settings() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    accessToken?: string;
    providerToken?: string;
    userEmail?: string;
  } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [gmailTestLoading, setGmailTestLoading] = useState(false);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [gmailThreads, setGmailThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 백엔드 개발자 제안: n8n Webhook 호출 → Supabase에 업서트된 후 로컬 조회
  useEffect(() => {
    const syncAndFetch = async () => {
      // 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.provider_token) return;

      setLoading(true);
      try {
        console.log('🔄 자동 Gmail 동기화 시작...');
        
        // 1) n8n Webhook 호출 (사용자별 액세스 토큰 전달)
        const webhookUrl = 'https://n8n.1000.school/webhook/gmail-sync';
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.provider_token }),
        });

        console.log('n8n 응답:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText
        });

        // 2) 잠시 대기 후 Supabase에서 최근 10개 레코드 조회
        console.log('⏳ n8n 처리 대기 중...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        const { data, error } = await supabase
          .from('gmail_emails')
          .select('*')
          .order('received_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Supabase 조회 에러:', error);
        } else {
          console.log('✅ 자동 동기화 완료, 메일 수:', data?.length || 0);
          setGmailThreads(data || []);
          
          // 로컬 스토리지에도 저장
          if (data && data.length > 0) {
            localStorage.setItem('gmail_emails_auto_sync', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error('자동 Gmail 동기화 중 에러:', err);
      } finally {
        setLoading(false);
      }
    };

    // 컴포넌트 마운트시 자동 동기화 실행
    syncAndFetch();
  }, []); // 컴포넌트 마운트시 한 번만 실행

  const handleGmailReconnect = async () => {
    try {
      setGmailLoading(true);
      
      console.log('=== Gmail 재연결 시작 ===');
      console.log('시작 시간:', new Date().toISOString());
      
      // 1. 기존 세션 클리어
      console.log('1. 기존 세션 클리어...');
      await supabase.auth.signOut();
      
      // 잠시 대기 (세션 클리어 완료 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. 새로운 Google OAuth 진행 (Gmail 스코프 포함)
      console.log('2. 새로운 Google OAuth 시작 (Gmail 권한 요청)...');
      await signInWithGoogle();
      console.log('✓ Google OAuth 완료');
      
      // 3. 새 토큰으로 Gmail 연결 진행
      await performGmailSync();
      
      alert('Gmail 재연결 성공! 🎉\n\n이번에는 Gmail 접근 권한이 포함된 토큰으로 다시 연결되었습니다.');
      
    } catch (error) {
      console.error('=== Gmail 재연결 실패 ===');
      console.error('오류:', error);
      alert(`Gmail 재연결 실패 ❌\n\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setGmailLoading(false);
    }
  };

  const performGmailSync = async () => {
    // 2. Supabase에서 access_token 가져오기
    console.log('2. Supabase 세션 가져오기...');
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.provider_token;
    
    console.log('=== 세션 정보 ===');
    console.log('로그인 상태:', !!session);
    console.log('사용자 이메일:', session?.user?.email);
    console.log('Provider Token 존재:', !!accessToken);
    console.log('Provider Token 길이:', accessToken?.length);
    console.log('Provider Token 시작 부분:', accessToken?.substring(0, 30) + '...');
    console.log('==================');
    
    if (!accessToken) {
      throw new Error('Provider token을 받을 수 없습니다. Google 로그인을 다시 시도하세요.');
    }
    
    // 3. n8n API로 access_token 전송
    console.log('3. Gmail Sync API 호출 시작...');
    console.log('API URL:', 'https://n8n.1000.school/webhook/gmail-sync');
    console.log('요청 데이터:', { access_token: accessToken.substring(0, 30) + '...' });
    
    const requestTime = Date.now();
    const response = await fetch('https://n8n.1000.school/webhook/gmail-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    });
    const responseTime = Date.now() - requestTime;
    
    console.log('=== API 응답 정보 ===');
    console.log('응답 시간:', responseTime + 'ms');
    console.log('응답 상태:', response.status, response.statusText);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n응답: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('=== API 성공 응답 ===');
    console.log('Raw Response:', result);
    console.log('응답 타입:', typeof result);
    console.log('응답 키들:', Object.keys(result));
    
    // 메일 데이터 확인
    if (result.emails && Array.isArray(result.emails)) {
      console.log('📧 받은 메일 수:', result.emails.length);
      console.log('메일 샘플:', result.emails.slice(0, 2));
    } else if (Array.isArray(result)) {
      console.log('📧 받은 메일 수:', result.length);
      console.log('메일 샘플:', result.slice(0, 2));
    } else {
      console.log('⚠️ 예상과 다른 응답 구조');
    }
    console.log('=====================');
    
    setGmailConnected(true);
    
    // 성공 메시지에 응답 정보 포함
    const emailCount = result.emails?.length || result.length || '알 수 없음';
    return { responseTime, emailCount, status: response.status };
  };

  const handleGmailConnect = async () => {
    try {
      setGmailLoading(true);
      
      console.log('=== Gmail 연결 시작 ===');
      console.log('시작 시간:', new Date().toISOString());
      
      // 1. Google OAuth 진행
      console.log('1. Google OAuth 시작...');
      await signInWithGoogle();
      console.log('✓ Google OAuth 완료');
      
      // 2. Gmail 동기화 진행
      const result = await performGmailSync();
      
      alert(`Gmail 연결 성공! 🎉\n\n📊 API 응답 정보:\n- 응답 시간: ${result.responseTime}ms\n- 받은 메일 수: ${result.emailCount}개\n- 응답 상태: ${result.status}\n\n자세한 내용은 Console을 확인하세요.`);
      
      // 2. Supabase에서 access_token 가져오기
      console.log('2. Supabase 세션 가져오기...');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;
      
      console.log('=== 세션 정보 ===');
      console.log('로그인 상태:', !!session);
      console.log('사용자 이메일:', session?.user?.email);
      console.log('Provider Token 존재:', !!accessToken);
      console.log('Provider Token 길이:', accessToken?.length);
      console.log('Provider Token 시작 부분:', accessToken?.substring(0, 30) + '...');
      console.log('==================');
      
      if (!accessToken) {
        throw new Error('Provider token을 받을 수 없습니다. Google 로그인을 다시 시도하세요.');
      }
      
      // 3. n8n API로 access_token 전송
      console.log('3. Gmail Sync API 호출 시작...');
      console.log('API URL:', 'https://n8n.1000.school/webhook/gmail-sync');
      console.log('요청 데이터:', { access_token: accessToken.substring(0, 30) + '...' });
      
      const requestTime = Date.now();
      const response = await fetch('https://n8n.1000.school/webhook/gmail-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });
      const responseTime = Date.now() - requestTime;
      
      console.log('=== API 응답 정보 ===');
      console.log('응답 시간:', responseTime + 'ms');
      console.log('응답 상태:', response.status, response.statusText);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n응답: ${errorText}`);
      }
      
      const apiResult = await response.json();
      console.log('=== API 성공 응답 ===');
      console.log('Raw Response:', apiResult);
      console.log('응답 타입:', typeof apiResult);
      console.log('응답 키들:', Object.keys(apiResult));
      
      // 메일 데이터 확인
      if (apiResult.emails && Array.isArray(apiResult.emails)) {
        console.log('📧 받은 메일 수:', apiResult.emails.length);
        console.log('메일 샘플:', apiResult.emails.slice(0, 2));
      } else if (Array.isArray(apiResult)) {
        console.log('📧 받은 메일 수:', apiResult.length);
        console.log('메일 샘플:', apiResult.slice(0, 2));
      } else {
        console.log('⚠️ 예상과 다른 응답 구조');
      }
      console.log('=====================');
      
      setGmailConnected(true);
      
      // 성공 메시지에 응답 정보 포함
      const emailCount = apiResult.emails?.length || apiResult.length || '알 수 없음';
      alert(`Gmail 연결 성공! 🎉\n\n📊 API 응답 정보:\n- 응답 시간: ${responseTime}ms\n- 받은 메일 수: ${emailCount}개\n- 응답 상태: ${response.status}\n\n자세한 내용은 Console을 확인하세요.`);
      
    } catch (error) {
      console.error('=== Gmail 연결 실패 ===');
      console.error('오류:', error);
      console.error('오류 타입:', typeof error);
      console.error('오류 메시지:', error instanceof Error ? error.message : String(error));
      console.error('========================');
      
      alert(`Gmail 연결 실패 ❌\n\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n자세한 내용은 Console을 확인하세요.`);
    } finally {
      setGmailLoading(false);
      console.log('=== Gmail 연결 종료 ===');
      console.log('종료 시간:', new Date().toISOString());
    }
  };

  const handleGmailFilter = async () => {
    try {
      setFilterLoading(true);
      
      // Gmail 분류 및 요약 API 호출
      const response = await fetch('https://n8n.1000.school/webhook/gmail-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('=== Gmail 분류 결과 ===');
      console.log('Raw Response:', result);
      
      // 응답 데이터 구조 확인 및 정규화
      let emails: ClassifiedEmail[] = [];
      if (Array.isArray(result)) {
        // 직접 배열인 경우
        emails = result;
      } else if (result.output && Array.isArray(result.output)) {
        // output 프로퍼티 안에 배열이 있는 경우
        emails = result.output;
      } else if (result[0] && result[0].output && Array.isArray(result[0].output)) {
        // 중첩 구조인 경우
        emails = result[0].output;
      }
      
      console.log('Processed Emails:', emails);
      console.log(`총 ${emails.length}개의 메일이 분류되었습니다.`);
      
      // 로컬 스토리지에 저장 (임시)
      localStorage.setItem('gmail_classified_emails', JSON.stringify(emails));
      
      alert(`메일 분류 완료!\n\n총 ${emails.length}개의 메일이 분류되었습니다.\n- 정보성: ${emails.filter(e => e.mail_type === '정보성').length}개\n- 광고성: ${emails.filter(e => e.mail_type === '광고성').length}개\n\n대시보드와 메일함에서 확인하세요!`);
      
    } catch (error) {
      console.error('메일 분류 실패:', error);
      alert(`메일 분류에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleCheckToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('=== 현재 토큰 상태 ===');
      console.log('Session:', session);
      console.log('로그인 상태:', !!session);
      console.log('Access Token:', session?.access_token);
      console.log('Provider Token (Google):', session?.provider_token);
      console.log('User:', session?.user);
      console.log('=====================');
      
      setTokenInfo({
        hasToken: !!session?.provider_token,
        accessToken: session?.access_token || undefined,
        providerToken: session?.provider_token || undefined,
        userEmail: session?.user?.email || undefined
      });
      
    } catch (error) {
      console.error('토큰 확인 오류:', error);
      setTokenInfo({
        hasToken: false
      });
      alert('토큰 확인 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다.');
    }
  };

  const testGmailSyncAPI = async () => {
    try {
      setTestLoading(true);
      
      console.log('=== Gmail Sync & Supabase 조회 시작 ===');
      console.log('시작 시간:', new Date().toISOString());
      
      // 현재 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;
      
      if (!accessToken) {
        throw new Error('Provider token이 없습니다. 먼저 Google 로그인을 하세요.');
      }
      
      console.log('📤 1단계: n8n Webhook 호출');
      console.log('- URL:', 'https://n8n.1000.school/webhook/gmail-sync');
      console.log('- Token 길이:', accessToken.length);
      
      // 1단계: n8n Webhook 호출 (Supabase에 데이터 저장)
      const webhookResponse = await fetch('https://n8n.1000.school/webhook/gmail-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });
      
      console.log('📥 n8n 응답:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText
      });
      
      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`n8n Webhook 호출 실패: ${webhookResponse.status} - ${errorText}`);
      }
      
      const webhookResult = await webhookResponse.json();
      console.log('n8n 응답 데이터:', webhookResult);
      
      // 2단계: 잠시 기다린 후 Supabase에서 데이터 조회
      console.log('⏳ 2단계: n8n 처리 대기 (5초)...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('📥 3단계: Supabase에서 Gmail 데이터 조회');
      const { data: gmailData, error } = await supabase
        .from('gmail_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Supabase 조회 에러:', error);
        throw new Error(`Supabase 조회 실패: ${error.message}`);
      }
      
      console.log('✅ Supabase 조회 결과:');
      console.log('- 메일 수:', gmailData?.length || 0);
      console.log('- 데이터:', gmailData);
      
      // 로컬 스토리지에 저장
      if (gmailData && gmailData.length > 0) {
        localStorage.setItem('gmail_emails_from_supabase', JSON.stringify(gmailData));
        console.log('✅ 로컬 스토리지에 저장 완료');
      }
      
      alert(`Gmail 동기화 완료! 🎉\n\n📊 결과:\n- n8n 응답: ${webhookResult.message || 'Success'}\n- Supabase 메일 수: ${gmailData?.length || 0}개\n\n${gmailData?.length ? '대시보드에서 메일을 확인하세요!' : 'n8n 워크플로우가 아직 처리 중일 수 있습니다.'}`);
      
    } catch (error) {
      console.error('=== Gmail Sync 실패 ===');
      console.error('오류:', error);
      alert(`Gmail 동기화 실패 ❌\n\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n자세한 내용은 Console을 확인하세요.`);
    } finally {
      setTestLoading(false);
      console.log('=== Gmail Sync & Supabase 조회 완료 ===');
    }
  };

  const checkWorkflowResult = async () => {
    try {
      setCheckLoading(true);
      
      console.log('=== 워크플로우 결과 확인 시작 ===');
      
      // 여러 가능한 엔드포인트 시도
      const possibleEndpoints = [
        'https://n8n.1000.school/webhook/gmail-result',
        'https://n8n.1000.school/webhook/gmail-status', 
        'https://n8n.1000.school/webhook/gmail-emails',
        'https://n8n.1000.school/webhook/gmail-data'
      ];
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 시도 중: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          console.log(`응답 상태: ${response.status}`);
          
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ ${endpoint} 성공:`, result);
            
            alert(`결과 발견! ✅\n\nEndpoint: ${endpoint}\n데이터: ${JSON.stringify(result, null, 2)}`);
            return;
          }
        } catch (error) {
          console.log(`❌ ${endpoint} 실패:`, error);
        }
      }
      
      alert(`결과를 찾을 수 없습니다 ❌\n\n시도한 엔드포인트:\n${possibleEndpoints.join('\n')}\n\n워크플로우가 아직 완료되지 않았거나,\n다른 방식으로 결과를 저장할 수 있습니다.\n\n백엔드 개발자에게 문의하세요!`);
      
    } catch (error) {
      console.error('워크플로우 결과 확인 실패:', error);
      alert(`결과 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setCheckLoading(false);
      console.log('=== 워크플로우 결과 확인 종료 ===');
    }
  };

  const testGmailAPIDirectly = async () => {
    try {
      setGmailTestLoading(true);
      
      console.log('=== Gmail API 직접 테스트 시작 ===');
      
      // 현재 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;
      
      if (!accessToken) {
        throw new Error('Provider token이 없습니다. 먼저 Google 로그인을 하세요.');
      }
      
      console.log('📧 Gmail API 직접 호출 테스트:');
      console.log('- Token 길이:', accessToken.length);
      console.log('- Token 시작 부분:', accessToken.substring(0, 30) + '...');
      
      // 1. 토큰 유효성 검사
      console.log('\n1️⃣ Google OAuth 토큰 정보 확인...');
      try {
        const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
        const tokenInfo = await tokenInfoResponse.json();
        
        if (tokenInfoResponse.ok) {
          console.log('✅ 토큰 정보:', tokenInfo);
          console.log('- 유효한 토큰');
          console.log('- 스코프:', tokenInfo.scope);
          console.log('- 만료까지:', tokenInfo.expires_in, '초');
        } else {
          console.error('❌ 토큰 검증 실패:', tokenInfo);
          alert(`토큰 검증 실패 ❌\n\n${JSON.stringify(tokenInfo, null, 2)}\n\n토큰이 만료되었거나 유효하지 않습니다.`);
          return;
        }
      } catch (tokenError) {
        console.error('❌ 토큰 검증 오류:', tokenError);
        alert(`토큰 검증 중 오류 발생: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
        return;
      }
      
      // 2. Gmail API 프로필 정보 확인
      console.log('\n2️⃣ Gmail 프로필 정보 확인...');
      try {
        const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ Gmail 프로필:', profileData);
          console.log('- 이메일:', profileData.emailAddress);
          console.log('- 총 메시지 수:', profileData.messagesTotal);
          console.log('- 총 스레드 수:', profileData.threadsTotal);
        } else {
          const profileError = await profileResponse.text();
          console.error('❌ Gmail 프로필 오류:', profileError);
          alert(`Gmail 프로필 접근 실패 ❌\n\n상태: ${profileResponse.status}\n오류: ${profileError}\n\n권한이 부족하거나 스코프 설정에 문제가 있을 수 있습니다.`);
          return;
        }
      } catch (profileError) {
        console.error('❌ Gmail 프로필 요청 오류:', profileError);
        alert(`Gmail API 요청 오류: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
        return;
      }
      
      // 3. 최신 메일 목록 확인 (최대 10개)
      console.log('\n3️⃣ 최신 메일 목록 확인...');
      try {
        const messagesResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          console.log('✅ 메일 목록:', messagesData);
          
          if (messagesData.messages && messagesData.messages.length > 0) {
            console.log('- 메일 개수:', messagesData.messages.length);
            console.log('- 첫 번째 메일 ID:', messagesData.messages[0].id);
            
            // 첫 번째 메일 상세 정보 가져오기
            console.log('\n4️⃣ 첫 번째 메일 상세 정보...');
            try {
              const firstMessageId = messagesData.messages[0].id;
              const messageDetailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${firstMessageId}`, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (messageDetailResponse.ok) {
                const messageDetail = await messageDetailResponse.json();
                console.log('✅ 메일 상세:', messageDetail);
                
                const headers = messageDetail.payload?.headers || [];
                const subject = headers.find((h: any) => h.name === 'Subject')?.value || '제목 없음';
                const from = headers.find((h: any) => h.name === 'From')?.value || '발신자 없음';
                
                alert(`Gmail API 직접 테스트 성공! ✅\n\n📧 확인된 정보:\n- 메일 개수: ${messagesData.messages.length}개\n- 첫 번째 메일 제목: ${subject}\n- 발신자: ${from}\n\n🔍 결론: 토큰은 정상적으로 Gmail에 접근 가능합니다!\n문제는 n8n 워크플로우 내부에 있을 가능성이 높습니다.\n\n자세한 내용은 Console을 확인하세요.`);
                
              } else {
                const detailError = await messageDetailResponse.text();
                console.error('❌ 메일 상세 정보 오류:', detailError);
              }
            } catch (detailError) {
              console.error('❌ 메일 상세 요청 오류:', detailError);
            }
            
          } else {
            console.log('⚠️ 메일함이 비어있음');
            alert(`Gmail API 접근 성공 ✅\n\n하지만 메일함이 비어있습니다.\n실제로 Gmail에 메일이 있는지 확인해보세요.`);
          }
        } else {
          const messagesError = await messagesResponse.text();
          console.error('❌ 메일 목록 오류:', messagesError);
          alert(`메일 목록 접근 실패 ❌\n\n상태: ${messagesResponse.status}\n오류: ${messagesError}`);
        }
      } catch (messagesError) {
        console.error('❌ 메일 목록 요청 오류:', messagesError);
        alert(`메일 목록 요청 오류: ${messagesError instanceof Error ? messagesError.message : String(messagesError)}`);
      }
      
    } catch (error) {
      console.error('=== Gmail API 직접 테스트 실패 ===');
      console.error('오류:', error);
      alert(`Gmail API 직접 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setGmailTestLoading(false);
      console.log('=== Gmail API 직접 테스트 종료 ===');
    }
  };

  const generateDiagnosisReport = async () => {
    try {
      setDiagnosisLoading(true);
      
      console.log('=== 종합 진단 리포트 생성 시작 ===');
      
      const report: any = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        testResults: {}
      };
      
      // 1. 세션 정보 확인
      const { data: { session } } = await supabase.auth.getSession();
      report.session = {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        providerTokenLength: session?.provider_token?.length || 0,
        userEmail: session?.user?.email,
        tokenExpiry: session?.expires_at
      };
      
      if (!session?.provider_token) {
        report.error = 'Provider token이 없음';
        console.log('📋 진단 리포트:', report);
        alert(`진단 리포트 생성 완료 ❌\n\n문제: Provider token이 없습니다.\n해결: Google 로그인을 다시 시도하세요.\n\n리포트는 Console에서 확인 가능합니다.`);
        return;
      }
      
      // 2. Google 토큰 검증
      try {
        const tokenResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${session.provider_token}`);
        const tokenInfo = await tokenResponse.json();
        
        report.testResults.tokenValidation = {
          success: tokenResponse.ok,
          tokenInfo: tokenInfo,
          scopes: tokenInfo.scope?.split(' ') || []
        };
      } catch (error) {
        report.testResults.tokenValidation = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // 3. Gmail API 접근 테스트
      try {
        const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
          headers: { 'Authorization': `Bearer ${session.provider_token}` }
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          report.testResults.gmailProfile = {
            success: true,
            emailAddress: profileData.emailAddress,
            messagesTotal: profileData.messagesTotal,
            threadsTotal: profileData.threadsTotal
          };
        } else {
          const errorText = await profileResponse.text();
          report.testResults.gmailProfile = {
            success: false,
            status: profileResponse.status,
            error: errorText
          };
        }
      } catch (error) {
        report.testResults.gmailProfile = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // 4. 메일 목록 접근 테스트
      try {
        const messagesResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
          headers: { 'Authorization': `Bearer ${session.provider_token}` }
        });
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          report.testResults.gmailMessages = {
            success: true,
            messageCount: messagesData.messages?.length || 0,
            hasMessages: !!(messagesData.messages && messagesData.messages.length > 0)
          };
        } else {
          const errorText = await messagesResponse.text();
          report.testResults.gmailMessages = {
            success: false,
            status: messagesResponse.status,
            error: errorText
          };
        }
      } catch (error) {
        report.testResults.gmailMessages = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // 5. n8n API 테스트
      try {
        const n8nResponse = await fetch('https://n8n.1000.school/webhook/gmail-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.provider_token })
        });
        
        const responseText = await n8nResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
        
        report.testResults.n8nAPI = {
          success: n8nResponse.ok,
          status: n8nResponse.status,
          response: responseData,
          responseSize: responseText.length
        };
      } catch (error) {
        report.testResults.n8nAPI = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
      
      // 진단 결과 분석
      const analysis = {
        tokenValid: report.testResults.tokenValidation?.success || false,
        gmailAccessible: report.testResults.gmailProfile?.success || false,
        hasEmails: report.testResults.gmailMessages?.hasMessages || false,
        n8nResponds: report.testResults.n8nAPI?.success || false
      };
      
      report.analysis = analysis;
      report.diagnosis = getDiagnosis(analysis);
      
      console.log('📋 최종 진단 리포트:', report);
      
      // 리포트를 백엔드 개발자가 이해하기 쉽게 포맷팅
      const reportText = formatReportForBackend(report);
      
      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(reportText);
        alert(`진단 리포트 생성 완료! ✅\n\n${report.diagnosis}\n\n📋 상세 리포트가 클립보드에 복사되었습니다.\n백엔드 개발자에게 공유하세요!\n\nConsole에서도 확인 가능합니다.`);
      } catch {
        alert(`진단 리포트 생성 완료! ✅\n\n${report.diagnosis}\n\n📋 상세 리포트는 Console에서 확인하세요.\n(클립보드 복사 실패)`);
      }
      
    } catch (error) {
      console.error('진단 리포트 생성 실패:', error);
      alert(`진단 리포트 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setDiagnosisLoading(false);
    }
  };

  const getDiagnosis = (analysis: any) => {
    if (!analysis.tokenValid) {
      return '❌ 문제: Google 토큰이 유효하지 않습니다.\n해결: Google 로그인을 다시 시도하세요.';
    }
    if (!analysis.gmailAccessible) {
      return '❌ 문제: Gmail API 접근 권한이 없습니다.\n해결: OAuth 스코프에 Gmail 읽기 권한이 포함되어야 합니다.';
    }
    if (!analysis.hasEmails) {
      return '⚠️ 문제: Gmail에 메일이 없습니다.\n확인: 실제 Gmail 계정에 메일이 있는지 확인하세요.';
    }
    if (!analysis.n8nResponds) {
      return '❌ 문제: n8n API가 응답하지 않습니다.\n해결: n8n 워크플로우 상태를 확인하세요.';
    }
    return '🔍 모든 테스트 통과 - n8n 워크플로우 내부 로직 확인 필요';
  };

  const formatReportForBackend = (report: any) => {
    return `
=== Gmail API 진단 리포트 ===
시간: ${report.timestamp}
사용자: ${report.session.userEmail}

🔑 토큰 상태:
- 토큰 존재: ${report.session.hasProviderToken ? '✅' : '❌'}
- 토큰 길이: ${report.session.providerTokenLength}
- 토큰 유효성: ${report.testResults.tokenValidation?.success ? '✅' : '❌'}
- 권한 스코프: ${report.testResults.tokenValidation?.scopes?.join(', ') || 'N/A'}

📧 Gmail API 접근:
- 프로필 접근: ${report.testResults.gmailProfile?.success ? '✅' : '❌'}
- 이메일 주소: ${report.testResults.gmailProfile?.emailAddress || 'N/A'}
- 총 메시지 수: ${report.testResults.gmailProfile?.messagesTotal || 0}
- 메일 목록 접근: ${report.testResults.gmailMessages?.success ? '✅' : '❌'}
- 실제 메일 개수: ${report.testResults.gmailMessages?.messageCount || 0}

🔄 n8n API 상태:
- API 응답: ${report.testResults.n8nAPI?.success ? '✅' : '❌'}
- 상태 코드: ${report.testResults.n8nAPI?.status || 'N/A'}
- 응답 내용: ${JSON.stringify(report.testResults.n8nAPI?.response || {})}

🎯 진단 결과:
${report.diagnosis}

💡 권장사항:
${report.analysis.tokenValid && report.analysis.gmailAccessible && report.analysis.hasEmails && report.analysis.n8nResponds 
  ? '- n8n 워크플로우 내부 로그 확인 필요\n- Gmail API 호출 부분의 오류 로깅 추가\n- 데이터베이스 저장 로직 검증 필요'
  : '- 위 진단 결과에 따라 문제 해결 필요'}
`;
     };

  const checkGmailScope = async () => {
    try {
      setScopeLoading(true);
      
      console.log('=== Gmail 스코프 확인 시작 ===');
      
      // 현재 세션에서 토큰 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token;
      
      if (!accessToken) {
        throw new Error('Provider token이 없습니다. 먼저 Google 로그인을 하세요.');
      }
      
      console.log('📤 토큰 정보:');
      console.log('- Token 길이:', accessToken.length);
      console.log('- Token 시작 부분:', accessToken.substring(0, 30) + '...');
      
      // Google OAuth 토큰 정보 확인
      const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      
      if (!tokenInfoResponse.ok) {
        const errorText = await tokenInfoResponse.text();
        throw new Error(`토큰 검증 실패: ${tokenInfoResponse.status} - ${errorText}`);
      }
      
      const tokenInfo = await tokenInfoResponse.json();
      
      console.log('📋 토큰 상세 정보:');
      console.log('- 전체 응답:', tokenInfo);
      console.log('- 사용자:', tokenInfo.email);
      console.log('- 만료 시간:', tokenInfo.expires_in, '초');
      console.log('- 스코프 문자열:', tokenInfo.scope);
      
      // 스코프 분석
      const scopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];
      console.log('📧 스코프 분석:');
      console.log('- 전체 스코프 개수:', scopes.length);
      console.log('- 전체 스코프 목록:', scopes);
      
      // Gmail 관련 스코프 확인
      const gmailScopes = {
        'gmail.readonly': 'https://www.googleapis.com/auth/gmail.readonly',
        'gmail.modify': 'https://www.googleapis.com/auth/gmail.modify',
        'gmail.full': 'https://mail.google.com/',
        'userinfo.email': 'https://www.googleapis.com/auth/userinfo.email',
        'userinfo.profile': 'https://www.googleapis.com/auth/userinfo.profile'
      };
      
      const scopeStatus: { [key: string]: boolean } = {};
      for (const [key, value] of Object.entries(gmailScopes)) {
        scopeStatus[key] = scopes.includes(value);
        console.log(`- ${key}: ${scopeStatus[key] ? '✅' : '❌'} (${value})`);
      }
      
      // 필수 스코프 확인
      const hasGmailReadonly = scopeStatus['gmail.readonly'];
      const hasUserInfo = scopeStatus['userinfo.email'] && scopeStatus['userinfo.profile'];
      
      console.log('🎯 필수 스코프 검사:');
      console.log('- Gmail 읽기 권한:', hasGmailReadonly ? '✅' : '❌');
      console.log('- 사용자 정보 권한:', hasUserInfo ? '✅' : '❌');
      
      // 결과 메시지 생성
      let resultMessage = `Gmail 스코프 확인 결과 🔍\n\n`;
      resultMessage += `📧 사용자: ${tokenInfo.email}\n`;
      resultMessage += `⏰ 토큰 만료: ${Math.floor(tokenInfo.expires_in / 60)}분 후\n\n`;
      
      resultMessage += `🔑 권한 상태:\n`;
      resultMessage += `• Gmail 읽기 권한: ${hasGmailReadonly ? '✅ 있음' : '❌ 없음'}\n`;
      resultMessage += `• 사용자 정보: ${hasUserInfo ? '✅ 있음' : '❌ 없음'}\n\n`;
      
      if (hasGmailReadonly) {
        resultMessage += `✅ Gmail 메일 읽기 권한이 정상적으로 설정되어 있습니다!\n\n`;
        resultMessage += `🔍 문제가 지속된다면 n8n 워크플로우 내부의\nGmail API 호출 부분을 확인해야 합니다.`;
      } else {
        resultMessage += `❌ Gmail 읽기 권한이 없습니다!\n\n`;
        resultMessage += `💡 해결 방법:\n`;
        resultMessage += `1. Supabase 대시보드 → Authentication → Providers → Google\n`;
        resultMessage += `2. Scopes에 다음 추가:\n`;
        resultMessage += `   "https://www.googleapis.com/auth/gmail.readonly"\n`;
        resultMessage += `3. Google Cloud Console에서도 동일하게 스코프 설정\n`;
        resultMessage += `4. 다시 Google 로그인 시도`;
      }
      
      resultMessage += `\n\n📋 전체 스코프 목록:\n${scopes.join('\n')}`;
      
      alert(resultMessage);
      
      // 백엔드 개발자용 요약 정보
      console.log('📤 백엔드 개발자 공유용 정보:');
      console.log(`사용자: ${tokenInfo.email}`);
      console.log(`Gmail 읽기 권한: ${hasGmailReadonly ? 'O' : 'X'}`);
      console.log(`현재 스코프: ${tokenInfo.scope}`);
      console.log(`문제: ${hasGmailReadonly ? 'n8n 워크플로우 내부 로직 확인 필요' : 'OAuth 스코프 설정 필요'}`);
      
    } catch (error) {
      console.error('=== Gmail 스코프 확인 실패 ===');
      console.error('오류:', error);
      alert(`Gmail 스코프 확인 실패 ❌\n\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n먼저 Google 로그인이 필요할 수 있습니다.`);
    } finally {
      setScopeLoading(false);
      console.log('=== Gmail 스코프 확인 종료 ===');
    }
  };

  const handleLogout = async () => {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
      try {
        console.log('=== 로그아웃 시작 ===');
        
        // 1. 로컬 스토리지 정리
        console.log('1. 로컬 스토리지 정리...');
        localStorage.removeItem('gmail_classified_emails');
        localStorage.removeItem('gmail_token_info');
        
        // 2. Supabase 로그아웃
        console.log('2. Supabase 로그아웃...');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Supabase 로그아웃 오류:', error);
          throw error;
        }
        
        console.log('✓ 로그아웃 완료');
        
        // 3. 상태 초기화
        setGmailConnected(false);
        setTokenInfo(null);
        
        // 4. 홈으로 이동
        window.location.href = "/";
        
      } catch (error) {
        console.error('=== 로그아웃 실패 ===');
        console.error('오류:', error);
        alert(`로그아웃 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        
        // 실패해도 강제로 홈으로 이동
        window.location.href = "/";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600 mt-2">계정 및 앱 설정을 관리하세요</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                프로필
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={(user as any)?.profileImageUrl} />
                  <AvatarFallback>
                    {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">
                    {(user as any)?.firstName && (user as any)?.lastName 
                      ? `${(user as any).firstName} ${(user as any).lastName}` 
                      : '사용자'}
                  </p>
                  <p className="text-sm text-gray-600">{(user as any)?.email}</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                프로필 편집
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">새 메일 알림</p>
                  <p className="text-sm text-gray-600">새로운 협찬 메일을 받을 때 알려드려요</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">일정 알림</p>
                  <p className="text-sm text-gray-600">예정된 일정 1시간 전에 알려드려요</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">수익 리포트</p>
                  <p className="text-sm text-gray-600">월간 수익 리포트를 이메일로 받아보세요</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Gmail Connection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Gmail 연결
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">Gmail 계정</p>
                    {gmailConnected ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {gmailConnected 
                      ? "Gmail이 연결되어 있습니다. 메일 동기화와 AI 분류가 가능합니다." 
                      : "Gmail을 연결하면 메일을 자동으로 분류하고 요약해드립니다."}
                  </p>
                </div>
                <Button 
                  onClick={handleGmailConnect}
                  disabled={gmailLoading || gmailConnected}
                  variant={gmailConnected ? "outline" : "default"}
                  className="ml-4"
                >
                  {gmailLoading ? (
                    "연결 중..."
                  ) : gmailConnected ? (
                    "연결됨"
                  ) : (
                    "연결하기"
                  )}
                </Button>
              </div>
              
              <div className="pt-3 border-t mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCheckToken}
                  className="w-full"
                >
                  🔍 토큰 상태 확인
                </Button>
                
                <Button 
                  onClick={checkGmailScope}
                  disabled={scopeLoading}
                  variant="secondary"
                  size="sm"
                  className="w-full bg-orange-100 hover:bg-orange-200 text-orange-800"
                >
                  {scopeLoading ? (
                    "🔑 스코프 확인 중..."
                  ) : (
                    "🔑 Gmail 스코프 확인"
                  )}
                </Button>
                
                {/* 토큰 정보 표시 */}
                {tokenInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">토큰 정보</h4>
                      <div className="flex items-center gap-1">
                        {tokenInfo.hasToken ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}`}>
                          {tokenInfo.hasToken ? '토큰 있음' : '토큰 없음'}
                        </span>
                      </div>
                    </div>
                    
                    {tokenInfo.userEmail && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">연결된 계정</p>
                        <p className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {tokenInfo.userEmail}
                        </p>
                      </div>
                    )}
                    
                    {tokenInfo.accessToken && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-600">Access Token</p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowToken(!showToken)}
                              className="h-6 px-2"
                            >
                              {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(tokenInfo.accessToken!)}
                              className="h-6 px-2"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs font-mono bg-white px-2 py-2 rounded border break-all">
                          {showToken ? tokenInfo.accessToken : `${tokenInfo.accessToken.substring(0, 20)}...`}
                        </div>
                      </div>
                    )}
                    
                    {tokenInfo.providerToken && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-600">Provider Token (Google)</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tokenInfo.providerToken!)}
                            className="h-6 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-xs font-mono bg-white px-2 py-2 rounded border break-all">
                          {showToken ? tokenInfo.providerToken : `${tokenInfo.providerToken.substring(0, 20)}...`}
                        </div>
                      </div>
                    )}
                    
                    {!tokenInfo.hasToken && (
                      <div className="text-sm text-gray-600 text-center py-2">
                        Google 로그인을 통해 토큰을 받아오세요.
                      </div>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={testGmailSyncAPI}
                  disabled={testLoading}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  {testLoading ? (
                    "🔍 API 테스트 중..."
                  ) : (
                    "🔍 Gmail Sync API 테스트"
                  )}
                </Button>
                
                <Button 
                  onClick={checkWorkflowResult}
                  disabled={checkLoading}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {checkLoading ? (
                    "🔄 결과 확인 중..."
                  ) : (
                    "🔄 워크플로우 결과 확인"
                  )}
                </Button>
                
                <Button 
                  onClick={testGmailAPIDirectly}
                  disabled={gmailTestLoading}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  {gmailTestLoading ? (
                    "📧 Gmail 직접 테스트 중..."
                  ) : (
                    "📧 Gmail API 직접 테스트"
                  )}
                </Button>
                
                <div className="pt-2 border-t">
                  <Button 
                    onClick={generateDiagnosisReport}
                    disabled={diagnosisLoading}
                    variant="default"
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {diagnosisLoading ? (
                      "📋 진단 리포트 생성 중..."
                    ) : (
                      "📋 종합 진단 리포트 생성"
                    )}
                  </Button>
                </div>
                
                <Button 
                  onClick={handleGmailFilter}
                  disabled={filterLoading}
                  variant="default"
                  size="sm"
                  className="w-full"
                >
                  {filterLoading ? (
                    "📧 메일 분류 중..."
                  ) : (
                    "📧 메일 분류 및 요약"
                  )}
                </Button>
              </div>

              {gmailConnected && (
                <div className="pt-3 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">동기화 권한</p>
                      <p className="font-medium text-green-600">✓ 메일 읽기</p>
                    </div>
                    <div>
                      <p className="text-gray-600">AI 분류</p>
                      <p className="font-medium text-green-600">✓ 활성화됨</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setGmailConnected(false);
                      alert('Gmail 연결이 해제되었습니다.');
                    }}
                  >
                    연결 해제
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gmail 동기화 데이터 표시 */}
          {(gmailThreads.length > 0 || loading) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  동기화된 Gmail 데이터
                  {loading && <span className="text-sm text-gray-500">(로딩 중...)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      n8n에서 Gmail 데이터를 처리 중입니다...
                    </div>
                  </div>
                ) : gmailThreads.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>총 {gmailThreads.length}개의 메일</span>
                      <button 
                        onClick={() => {
                          const data = localStorage.getItem('gmail_emails_auto_sync');
                          if (data) {
                            console.log('로컬 스토리지 Gmail 데이터:', JSON.parse(data));
                            alert('Console에 상세 데이터를 출력했습니다.');
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        상세 보기
                      </button>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {gmailThreads.slice(0, 5).map((email, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900 line-clamp-1">
                                {email.subject || '제목 없음'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {email.sender_email || email.from || '발신자 정보 없음'}
                              </p>
                              {email.mail_type && (
                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                  {email.mail_type}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {email.received_at ? 
                                new Date(email.received_at).toLocaleDateString() :
                                '날짜 정보 없음'
                              }
                            </div>
                          </div>
                          
                          {email.summary && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {email.summary}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {gmailThreads.length > 5 && (
                        <div className="text-center py-2">
                          <span className="text-sm text-gray-500">
                            외 {gmailThreads.length - 5}개 더 있음
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <button 
                        onClick={() => {
                          // 수동으로 다시 동기화
                          window.location.reload();
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >
                        🔄 새로고침
                      </button>
                      <button 
                        onClick={() => {
                          setGmailThreads([]);
                          localStorage.removeItem('gmail_emails_auto_sync');
                          alert('로컬 데이터를 삭제했습니다.');
                        }}
                        className="px-3 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    아직 동기화된 Gmail 데이터가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* App Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                앱 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">다크 모드</p>
                  <p className="text-sm text-gray-600">어두운 테마를 사용합니다</p>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">자동 저장</p>
                  <p className="text-sm text-gray-600">작성 중인 내용을 자동으로 저장합니다</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                계정 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => alert('데이터 내보내기 기능은 곧 업데이트 예정입니다.')}
              >
                <FileText className="w-4 h-4 mr-2" />
                데이터 내보내기
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => alert('개인정보 처리방침 페이지로 이동합니다.')}
              >
                <Shield className="w-4 h-4 mr-2" />
                개인정보 처리방침
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => alert('서비스 약관 페이지로 이동합니다.')}
              >
                <FileText className="w-4 h-4 mr-2" />
                서비스 약관
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => alert('고객센터 페이지로 이동합니다.')}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                고객센터
              </Button>
              
              <div className="border-t pt-3 mt-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
