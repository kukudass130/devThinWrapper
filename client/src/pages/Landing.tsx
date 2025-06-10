import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/supabase";
import { useState } from "react";

export default function Landing() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              인플루언서 매니저
            </h1>
            <p className="text-gray-600">
              협찬 제의와 스케줄을 효율적으로 관리하세요
            </p>
          </div>

          {/* Login Options */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>로그인</span>
                <div className="flex-1 h-px bg-gray-300"></div>
                <span>회원가입</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 h-12"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
{loading ? "로그인 중..." : "Google로 로그인"}
            </Button>

            <div className="text-center text-sm text-gray-500">
              OR CONTINUE WITH
            </div>

            {/* Additional Login Options (Visual Only) */}
            <div className="flex justify-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center cursor-pointer">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center cursor-pointer">
                <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
