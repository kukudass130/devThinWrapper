import {
  type User,
  type UpsertUser,
  type Email,
  type InsertEmail,
  type CalendarEvent,
  type InsertCalendarEvent,
  type Revenue,
  type InsertRevenue,
} from "@shared/schema";
import { supabase } from "./db";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Email operations
  getEmails(userId: string, category?: string): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmailStatus(emailId: number, category: string): Promise<void>;
  getEmailStats(userId: string): Promise<{ pending: number; important: number; accepted: number; rejected: number }>;
  
  // Calendar operations
  getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getUpcomingEvents(userId: string, limit?: number): Promise<CalendarEvent[]>;
  
  // Revenue operations
  getRevenue(userId: string, startDate?: Date, endDate?: Date): Promise<Revenue[]>;
  createRevenue(revenue: InsertRevenue): Promise<Revenue>;
  getMonthlyRevenue(userId: string): Promise<{ total: number; growth: number }>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    newEmails: number;
    monthlySponsors: number;
    scheduledEvents: number;
    monthlyRevenue: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const { data: user } = await supabase
      .from('users')
      .upsert({
        ...userData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return user!;
  }

  // Email operations
  async getEmails(userId: string, category?: string): Promise<Email[]> {
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    
    const { data: emails } = await query;
    return emails || [];
  }

  async createEmail(email: InsertEmail): Promise<Email> {
    const { data: newEmail } = await supabase
      .from('emails')
      .insert(email)
      .select()
      .single();
    return newEmail!;
  }

  async updateEmailStatus(emailId: number, category: string): Promise<void> {
    await supabase
      .from('emails')
      .update({ category })
      .eq('id', emailId);
  }

  async getEmailStats(userId: string): Promise<{ pending: number; important: number; accepted: number; rejected: number }> {
    const [pendingResult, importantResult, acceptedResult, rejectedResult] = await Promise.all([
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('category', 'pending'),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('category', 'important'),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('category', 'accepted'),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('category', 'rejected'),
    ]);

    return {
      pending: pendingResult.count || 0,
      important: importantResult.count || 0,
      accepted: acceptedResult.count || 0,
      rejected: rejectedResult.count || 0,
    };
  }

  // Calendar operations
  async getCalendarEvents(userId: string, startDate?: Date, endDate?: Date): Promise<CalendarEvent[]> {
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (startDate && endDate) {
      query = query
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString());
    }
    
    const { data: events } = await query;
    return events || [];
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const { data: newEvent } = await supabase
      .from('calendar_events')
      .insert(event)
      .select()
      .single();
    return newEvent!;
  }

  async getUpcomingEvents(userId: string, limit = 5): Promise<CalendarEvent[]> {
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit);
    
    return events || [];
  }

  // Revenue operations
  async getRevenue(userId: string, startDate?: Date, endDate?: Date): Promise<Revenue[]> {
    let query = supabase
      .from('revenue')
      .select('*')
      .eq('user_id', userId)
      .order('received_at', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('received_at', startDate.toISOString())
        .lte('received_at', endDate.toISOString());
    }
    
    const { data: revenue } = await query;
    return revenue || [];
  }

  async createRevenue(revenueData: InsertRevenue): Promise<Revenue> {
    const { data: newRevenue } = await supabase
      .from('revenue')
      .insert(revenueData)
      .select()
      .single();
    return newRevenue!;
  }

  async getMonthlyRevenue(userId: string): Promise<{ total: number; growth: number }> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthResult, lastMonthResult] = await Promise.all([
      supabase
        .from('revenue')
        .select('amount')
        .eq('user_id', userId)
        .gte('received_at', thisMonthStart.toISOString()),
      supabase
        .from('revenue')
        .select('amount')
        .eq('user_id', userId)
        .gte('received_at', lastMonthStart.toISOString())
        .lte('received_at', lastMonthEnd.toISOString()),
    ]);

    const thisMonthTotal = (thisMonthResult.data || []).reduce((sum, r) => sum + r.amount, 0);
    const lastMonthTotal = (lastMonthResult.data || []).reduce((sum, r) => sum + r.amount, 0);
    const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    return { total: thisMonthTotal, growth };
  }

  async getDashboardStats(userId: string): Promise<{
    newEmails: number;
    monthlySponsors: number;
    scheduledEvents: number;
    monthlyRevenue: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 병렬로 모든 통계 가져오기
    const [newEmailsResult, monthlyRevenueResult, scheduledEventsResult] = await Promise.all([
      // 지난 주 새 이메일
      supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', weekStart.toISOString()),
      
      // 이번 달 수익
      supabase
        .from('revenue')
        .select('amount')
        .eq('user_id', userId)
        .gte('received_at', monthStart.toISOString()),
      
      // 향후 예정된 이벤트
      supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_date', now.toISOString()),
    ]);

    const monthlyRevenue = (monthlyRevenueResult.data || []).reduce((sum, r) => sum + r.amount, 0);

    return {
      newEmails: newEmailsResult.count || 0,
      monthlySponsors: 0, // 이 값은 별도 계산 로직 필요
      scheduledEvents: scheduledEventsResult.count || 0,
      monthlyRevenue: monthlyRevenue,
    };
  }
}

export const storage: IStorage = new DatabaseStorage();
