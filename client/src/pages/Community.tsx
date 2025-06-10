import { Card, CardContent } from "@/components/ui/card";
import { Users, MessageCircle, Heart, Share2 } from "lucide-react";

export default function Community() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">커뮤니티</h1>
        <p className="text-gray-600 mt-2">다른 인플루언서들과 소통하세요</p>
      </div>

      {/* Coming Soon Section */}
      <Card>
        <CardContent className="p-12 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            커뮤니티 준비 중
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            곧 다른 인플루언서들과 소통할 수 있는 커뮤니티 공간이 제공될 예정입니다. 
            협찬 정보 공유, 노하우 교환, 네트워킹 등 다양한 기능을 준비하고 있어요.
          </p>

          {/* Feature Preview */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">실시간 채팅</h3>
              <p className="text-sm text-gray-600">
                다른 인플루언서들과 실시간으로 소통하고 정보를 공유하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">협찬 후기</h3>
              <p className="text-sm text-gray-600">
                브랜드별 협찬 후기와 평점을 확인하고 공유하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">노하우 공유</h3>
              <p className="text-sm text-gray-600">
                콘텐츠 제작 팁과 마케팅 노하우를 공유하고 배우세요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
