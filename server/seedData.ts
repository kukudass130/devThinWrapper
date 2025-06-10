import { storage } from "./storage";

export async function seedSampleData(userId: string) {
  try {
    // Check if user already has data
    const existingEmails = await storage.getEmails(userId);
    if (existingEmails.length > 0) {
      console.log("User already has data, skipping seed");
      return;
    }

    console.log("Seeding sample data for user:", userId);

    // Create sample emails
    const sampleEmails = [
      {
        userId,
        subject: "뷰티 브랜드 A 협찬 제의",
        content: "안녕하세요, 저희 뷰티 브랜드에서 인플루언서님과의 협업을 제안드리고 싶습니다. 신제품 립스틱 라인을 소개해주실 수 있을까요?",
        senderName: "김마케팅",
        senderEmail: "marketing@beautyA.com",
        category: "pending",
        sponsorshipAmount: 1500000,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        aiSummary: "뷰티 브랜드의 신제품 립스틱 홍보 협찬 제의. 150만원 협찬비 제안.",
        isRead: false
      },
      {
        userId,
        subject: "패션 브랜드 B 컬렉션 촬영",
        content: "새로운 여름 컬렉션 런칭을 위한 촬영 모델로 섭외드리고 싶습니다. 브랜드 앰배서더 계약도 논의 가능합니다.",
        senderName: "박디렉터",
        senderEmail: "director@fashionB.com",
        category: "important",
        sponsorshipAmount: 3000000,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        aiSummary: "패션 브랜드 여름 컬렉션 촬영 및 앰배서더 계약 제안. 300만원 협찬비.",
        isRead: true
      },
      {
        userId,
        subject: "생활용품 브랜드 C 리뷰 요청",
        content: "저희 생활용품을 체험해보시고 솔직한 리뷰를 남겨주세요. 제품 무료 제공과 함께 리뷰 비용을 지급해드립니다.",
        senderName: "이매니저",
        senderEmail: "manager@lifeC.com",
        category: "accepted",
        sponsorshipAmount: 800000,
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        aiSummary: "생활용품 체험 리뷰 요청. 제품 제공 + 80만원 리뷰 비용 지급.",
        isRead: true
      },
      {
        userId,
        subject: "건강식품 브랜드 D 광고 문의",
        content: "건강기능식품 프로모션 광고에 참여해주실 의향이 있으신지 문의드립니다.",
        senderName: "최광고",
        senderEmail: "ad@healthD.com",
        category: "rejected",
        sponsorshipAmount: 500000,
        deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        aiSummary: "건강기능식품 광고 참여 문의. 50만원 광고비 제안.",
        isRead: true
      }
    ];

    // Create sample calendar events
    const sampleEvents = [
      {
        userId,
        title: "뷰티 브랜드 A 립스틱 촬영",
        description: "신제품 립스틱 라인 홍보 콘텐츠 촬영",
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
        location: "스튜디오 A",
        status: "scheduled",
        eventType: "shooting"
      },
      {
        userId,
        title: "패션 브랜드 B 미팅",
        description: "여름 컬렉션 협업 논의 및 계약서 검토",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // +2 hours
        location: "패션 브랜드 B 본사",
        status: "scheduled",
        eventType: "meeting"
      },
      {
        userId,
        title: "생활용품 C 언박싱 콘텐츠 제작",
        description: "제품 언박싱 및 리뷰 영상 촬영",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4 hours
        location: "홈 스튜디오",
        status: "scheduled",
        eventType: "content"
      }
    ];

    // Create sample revenue records
    const sampleRevenue = [
      {
        userId,
        amount: 1500000,
        source: "뷰티 브랜드 A",
        description: "립스틱 협찬비",
        receivedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        userId,
        amount: 2200000,
        source: "패션 브랜드 E",
        description: "봄 컬렉션 촬영비",
        receivedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      },
      {
        userId,
        amount: 800000,
        source: "생활용품 브랜드 F",
        description: "제품 리뷰 비용",
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];

    // Insert sample data
    for (const email of sampleEmails) {
      await storage.createEmail(email);
    }

    for (const event of sampleEvents) {
      await storage.createCalendarEvent(event);
    }

    for (const revenue of sampleRevenue) {
      await storage.createRevenue(revenue);
    }

    console.log("Sample data seeded successfully");
  } catch (error) {
    console.error("Error seeding sample data:", error);
  }
}