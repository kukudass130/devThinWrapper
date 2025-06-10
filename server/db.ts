import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://strjiukfgtwzonucwmec.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0cmppdWtmZ3R3em9udWN3bWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5ODYyMjYsImV4cCI6MjA2MzU2MjIyNn0.yuFp4Lmn03TqA4VRQpXPbBsaP-5bzFLPjHSAR9kjg9E';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase 클라이언트가 초기화되었습니다.');
