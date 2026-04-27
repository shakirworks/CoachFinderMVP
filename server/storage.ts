import { type Athlete, type InsertAthlete, type Coach, type InsertCoach, type Message, type InsertMessage, type AvailabilitySlot, type InsertAvailabilitySlot, type Purchase, type InsertPurchase, type Invoice, type InsertInvoice, type PurchaseStatus, type Notification, type InsertNotification, type VerificationCode, type InsertVerificationCode, athletes, coaches, messages, availabilitySlots, purchases, invoices, notifications, verificationCodes } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, inArray, ilike } from "drizzle-orm";

export interface IStorage {
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthleteByEmail(email: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  deleteAthlete(id: string): Promise<void>;
  getAllAthletes(): Promise<Athlete[]>;
  
  getCoach(id: string): Promise<Coach | undefined>;
  getCoachByEmail(email: string): Promise<Coach | undefined>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: string, updates: Partial<InsertCoach>): Promise<Coach | undefined>;
  deleteCoach(id: string): Promise<void>;
  getAllCoaches(): Promise<Coach[]>;

  checkEmailExists(email: string): Promise<{ exists: boolean; role: "athlete" | "coach" | null }>;

  createMessage(message: InsertMessage): Promise<Message>;
  getMessageThread(athleteId: string, coachId: string): Promise<Message[]>;
  getAthleteMessageThreads(athleteId: string): Promise<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>>;
  getCoachMessageThreads(coachId: string): Promise<Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>>;

  createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot>;
  getCoachAvailability(coachId: string): Promise<AvailabilitySlot[]>;
  getAvailabilitySlotsByIds(slotIds: string[]): Promise<AvailabilitySlot[]>;
  deleteAvailabilitySlot(slotId: string): Promise<void>;
  clearDayAvailability(coachId: string, date: string): Promise<void>;

  createPurchase(purchase: InsertPurchase): Promise<Purchase>;
  getPurchase(id: string): Promise<Purchase | undefined>;
  getPurchasesByAthlete(athleteId: string): Promise<Purchase[]>;
  getPurchasesByCoach(coachId: string): Promise<Purchase[]>;
  updatePurchaseStatus(id: string, status: PurchaseStatus, providerTransactionId?: string): Promise<Purchase | undefined>;
  updatePurchaseSession(id: string, sessionId: string): Promise<Purchase | undefined>;

  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByPurchase(purchaseId: string): Promise<Invoice | undefined>;
  getInvoicesByCoach(coachId: string): Promise<Invoice[]>;
  getInvoicesByAthlete(athleteId: string): Promise<Invoice[]>;
  updateInvoicePaidAt(id: string, paidAt: Date, receiptUrl?: string): Promise<Invoice | undefined>;
  generateInvoiceNumber(): Promise<string>;

  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByRecipient(recipientId: string, recipientType: string): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  getUnreadNotificationCount(recipientId: string, recipientType: string): Promise<number>;

  deleteAvailabilitySlotsByIds(slotIds: string[]): Promise<void>;

  createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(email: string, code: string, role: string): Promise<VerificationCode | undefined>;
  getVerificationCodeByToken(token: string, type?: string): Promise<VerificationCode | undefined>;
  markVerificationCodeUsed(id: string): Promise<void>;
  deleteExpiredVerificationCodes(): Promise<void>;
}

export class MemStorage implements IStorage {
  private athletes: Map<string, Athlete>;
  private coaches: Map<string, Coach>;
  private messages: Message[];

  constructor() {
    this.athletes = new Map();
    this.coaches = new Map();
    this.messages = [];
    this.initializeDummyData();
  }

  private initializeDummyData() {
    const ontarioLocations = [
      "Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton",
      "London", "Markham", "Vaughan", "Kitchener", "Windsor",
      "Oakville", "Burlington", "Barrie", "Oshawa", "St. Catharines",
      "Cambridge", "Kingston", "Guelph", "Waterloo", "Sudbury"
    ];
    
    const sports = ["Soccer", "Tennis", "Golf"];
    
    const coaches = [
      { name: "Michael Thompson", email: "michael.thompson@email.com", sport: "Soccer", location: "Toronto" },
      { name: "Sarah Johnson", email: "sarah.johnson@email.com", sport: "Tennis", location: "Ottawa" },
      { name: "David Chen", email: "david.chen@email.com", sport: "Golf", location: "Mississauga" },
      { name: "Emily Rodriguez", email: "emily.rodriguez@email.com", sport: "Soccer", location: "Brampton" },
      { name: "James Wilson", email: "james.wilson@email.com", sport: "Tennis", location: "Hamilton" },
      { name: "Olivia Brown", email: "olivia.brown@email.com", sport: "Golf", location: "London" },
      { name: "Robert Garcia", email: "robert.garcia@email.com", sport: "Soccer", location: "Markham" },
      { name: "Jessica Martinez", email: "jessica.martinez@email.com", sport: "Tennis", location: "Vaughan" },
      { name: "Daniel Lee", email: "daniel.lee@email.com", sport: "Golf", location: "Kitchener" },
      { name: "Amanda Taylor", email: "amanda.taylor@email.com", sport: "Soccer", location: "Windsor" },
      { name: "Christopher White", email: "christopher.white@email.com", sport: "Tennis", location: "Oakville" },
      { name: "Rachel Kim", email: "rachel.kim@email.com", sport: "Golf", location: "Burlington" },
      { name: "Matthew Anderson", email: "matthew.anderson@email.com", sport: "Soccer", location: "Barrie" },
      { name: "Jennifer Patel", email: "jennifer.patel@email.com", sport: "Tennis", location: "Oshawa" },
      { name: "Andrew Singh", email: "andrew.singh@email.com", sport: "Golf", location: "St. Catharines" },
      { name: "Lauren Murphy", email: "lauren.murphy@email.com", sport: "Soccer", location: "Cambridge" },
      { name: "Kevin O'Connor", email: "kevin.oconnor@email.com", sport: "Tennis", location: "Kingston" },
      { name: "Nicole Davis", email: "nicole.davis@email.com", sport: "Golf", location: "Guelph" },
      { name: "Brandon Mitchell", email: "brandon.mitchell@email.com", sport: "Soccer", location: "Waterloo" },
      { name: "Stephanie Clark", email: "stephanie.clark@email.com", sport: "Tennis", location: "Sudbury" }
    ];

    const coachingOptionsOptions = [
      ["Adults"],
      ["Kids"],
      ["Groups"],
      ["Adults", "Kids"],
      ["Adults", "Groups"],
      ["Kids", "Groups"],
      ["Adults", "Kids", "Groups"]
    ];
    
    const studentLevelsOptions = [
      ["Beginner"],
      ["Intermediate"],
      ["Advanced"],
      ["Beginner", "Intermediate"],
      ["Intermediate", "Advanced"],
      ["Beginner", "Intermediate", "Advanced"]
    ];
    
    const hourlyRates = ["50", "75", "100", "125", "150"];
    const experienceYears = ["2", "5", "8", "10", "15"];
    
    coaches.forEach((coach, index) => {
      const id = randomUUID();
      const coachData: Coach = {
        id,
        name: coach.name,
        sport: coach.sport,
        location: coach.location,
        email: coach.email,
        password: "demo",
        emailVerified: "true",
        profileImage: null,
        certification: null,
        performanceLevel: null,
        age: null,
        gender: null,
        bio: null,
        hourlyRate: hourlyRates[index % hourlyRates.length],
        coachingOptions: coachingOptionsOptions[index % coachingOptionsOptions.length],
        yearsOfExperience: experienceYears[index % experienceYears.length],
        studentLevels: studentLevelsOptions[index % studentLevelsOptions.length],
        stripeAccountId: null,
        stripeAccountStatus: null,
        stripeOnboardingComplete: null,
      };
      this.coaches.set(id, coachData);
    });
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async getAthleteByEmail(email: string): Promise<Athlete | undefined> {
    return Array.from(this.athletes.values()).find(
      (athlete) => athlete.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const id = randomUUID();
    const athlete: Athlete = {
      id,
      name: insertAthlete.name,
      sport: insertAthlete.sport,
      location: insertAthlete.location,
      email: insertAthlete.email,
      password: insertAthlete.password,
      emailVerified: insertAthlete.emailVerified ?? "false",
      profileImage: insertAthlete.profileImage ?? null,
      availableForCoachRequests: insertAthlete.availableForCoachRequests ?? "false",
      gender: insertAthlete.gender ?? null,
      age: insertAthlete.age ?? null,
      skillLevel: insertAthlete.skillLevel ?? null,
      preferredCoachGender: insertAthlete.preferredCoachGender ?? null,
    };
    this.athletes.set(id, athlete);
    return athlete;
  }

  async updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const athlete = this.athletes.get(id);
    if (!athlete) {
      return undefined;
    }
    
    const updatedAthlete: Athlete = {
      ...athlete,
      ...updates,
      id: athlete.id,
      email: athlete.email,
    };
    
    this.athletes.set(id, updatedAthlete);
    return updatedAthlete;
  }

  async deleteAthlete(id: string): Promise<void> {
    this.athletes.delete(id);
    this.messages = this.messages.filter(m => m.athleteId !== id);
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }

  async getCoach(id: string): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }

  async getCoachByEmail(email: string): Promise<Coach | undefined> {
    return Array.from(this.coaches.values()).find(
      (coach) => coach.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const id = randomUUID();
    const coach: Coach = {
      id,
      name: insertCoach.name,
      sport: insertCoach.sport,
      location: insertCoach.location,
      email: insertCoach.email,
      password: insertCoach.password,
      emailVerified: insertCoach.emailVerified ?? "false",
      profileImage: insertCoach.profileImage ?? null,
      certification: insertCoach.certification ?? null,
      performanceLevel: insertCoach.performanceLevel ?? null,
      age: insertCoach.age ?? null,
      gender: insertCoach.gender ?? null,
      bio: insertCoach.bio ?? null,
      hourlyRate: insertCoach.hourlyRate ?? null,
      coachingOptions: insertCoach.coachingOptions ?? null,
      yearsOfExperience: insertCoach.yearsOfExperience ?? null,
      studentLevels: insertCoach.studentLevels ?? null,
      stripeAccountId: null,
      stripeAccountStatus: null,
      stripeOnboardingComplete: null,
    };
    this.coaches.set(id, coach);
    return coach;
  }

  async updateCoach(id: string, updates: Partial<InsertCoach>): Promise<Coach | undefined> {
    const coach = this.coaches.get(id);
    if (!coach) {
      return undefined;
    }
    
    const updatedCoach: Coach = {
      ...coach,
      ...updates,
      id: coach.id,
      email: coach.email,
    };
    
    this.coaches.set(id, updatedCoach);
    return updatedCoach;
  }

  async deleteCoach(id: string): Promise<void> {
    this.coaches.delete(id);
    this.messages = this.messages.filter(m => m.coachId !== id);
  }

  async getAllCoaches(): Promise<Coach[]> {
    return Array.from(this.coaches.values());
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean; role: "athlete" | "coach" | null }> {
    const athlete = await this.getAthleteByEmail(email);
    if (athlete) {
      return { exists: true, role: "athlete" };
    }
    const coach = await this.getCoachByEmail(email);
    if (coach) {
      return { exists: true, role: "coach" };
    }
    return { exists: false, role: null };
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      athleteId: insertMessage.athleteId,
      coachId: insertMessage.coachId,
      message: insertMessage.message,
      senderType: insertMessage.senderType,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async getMessageThread(athleteId: string, coachId: string): Promise<Message[]> {
    return this.messages
      .filter(m => m.athleteId === athleteId && m.coachId === coachId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAthleteMessageThreads(athleteId: string): Promise<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>> {
    const athleteMessages = this.messages.filter(m => m.athleteId === athleteId);
    const coachIdsSet = new Set(athleteMessages.map(m => m.coachId));
    const coachIds = Array.from(coachIdsSet);
    
    const threads = coachIds.map(coachId => {
      const coach = this.coaches.get(coachId);
      if (!coach) return null;
      
      const threadMessages = athleteMessages.filter(m => m.coachId === coachId);
      const lastMessage = threadMessages[threadMessages.length - 1];
      
      return {
        coach,
        lastMessage,
        unreadCount: 0,
      };
    }).filter(Boolean) as Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>;
    
    return threads.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async getCoachMessageThreads(coachId: string): Promise<Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>> {
    const coachMessages = this.messages.filter(m => m.coachId === coachId);
    const athleteIdsSet = new Set(coachMessages.map(m => m.athleteId));
    const athleteIds = Array.from(athleteIdsSet);
    
    const threads = athleteIds.map(athleteId => {
      const athlete = this.athletes.get(athleteId);
      if (!athlete) return null;
      
      const threadMessages = coachMessages.filter(m => m.athleteId === athleteId);
      const lastMessage = threadMessages[threadMessages.length - 1];
      
      return {
        athlete,
        lastMessage,
        unreadCount: 0,
      };
    }).filter(Boolean) as Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>;
    
    return threads.sort((a, b) => 
      b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
    );
  }

  async createAvailabilitySlot(slot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getCoachAvailability(coachId: string): Promise<AvailabilitySlot[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async clearDayAvailability(coachId: string, date: string): Promise<void> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getAvailabilitySlotsByIds(slotIds: string[]): Promise<AvailabilitySlot[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async createPurchase(purchase: InsertPurchase): Promise<Purchase> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getPurchasesByAthlete(athleteId: string): Promise<Purchase[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getPurchasesByCoach(coachId: string): Promise<Purchase[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async updatePurchaseStatus(id: string, status: PurchaseStatus, providerTransactionId?: string): Promise<Purchase | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async updatePurchaseSession(id: string, sessionId: string): Promise<Purchase | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getInvoiceByPurchase(purchaseId: string): Promise<Invoice | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async updateInvoicePaidAt(id: string, paidAt: Date, receiptUrl?: string): Promise<Invoice | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async generateInvoiceNumber(): Promise<string> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getInvoicesByCoach(coachId: string): Promise<Invoice[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getInvoicesByAthlete(athleteId: string): Promise<Invoice[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getNotificationsByRecipient(recipientId: string, recipientType: string): Promise<Notification[]> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getUnreadNotificationCount(recipientId: string, recipientType: string): Promise<number> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async deleteAvailabilitySlotsByIds(slotIds: string[]): Promise<void> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async createVerificationCode(code: InsertVerificationCode): Promise<VerificationCode> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getVerificationCode(email: string, code: string, role: string): Promise<VerificationCode | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async getVerificationCodeByToken(token: string, type?: string): Promise<VerificationCode | undefined> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async markVerificationCodeUsed(id: string): Promise<void> {
    throw new Error("Not implemented - use PostgresStorage");
  }

  async deleteExpiredVerificationCodes(): Promise<void> {
    throw new Error("Not implemented - use PostgresStorage");
  }
}

export class PostgresStorage implements IStorage {
  async getAthlete(id: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.id, id));
    return result[0];
  }

  async getAthleteByEmail(email: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(ilike(athletes.email, email));
    return result[0];
  }

  async createAthlete(insertAthlete: InsertAthlete): Promise<Athlete> {
    const result = await db.insert(athletes).values(insertAthlete).returning();
    return result[0];
  }

  async updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete | undefined> {
    const result = await db
      .update(athletes)
      .set(updates)
      .where(eq(athletes.id, id))
      .returning();
    return result[0];
  }

  async deleteAthlete(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.athleteId, id));
    await db.delete(purchases).where(eq(purchases.athleteId, id));
    await db.delete(messages).where(eq(messages.athleteId, id));
    await db.delete(athletes).where(eq(athletes.id, id));
  }

  async getAllAthletes(): Promise<Athlete[]> {
    return await db.select().from(athletes);
  }

  async getCoach(id: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches).where(eq(coaches.id, id));
    return result[0];
  }

  async getCoachByEmail(email: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches).where(ilike(coaches.email, email));
    return result[0];
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const result = await db.insert(coaches).values(insertCoach).returning();
    return result[0];
  }

  async updateCoach(id: string, updates: Partial<InsertCoach>): Promise<Coach | undefined> {
    const result = await db
      .update(coaches)
      .set(updates)
      .where(eq(coaches.id, id))
      .returning();
    return result[0];
  }

  async deleteCoach(id: string): Promise<void> {
    await db.delete(messages).where(eq(messages.coachId, id));
    await db.delete(availabilitySlots).where(eq(availabilitySlots.coachId, id));
    await db.delete(coaches).where(eq(coaches.id, id));
  }

  async getAllCoaches(): Promise<Coach[]> {
    return await db.select().from(coaches);
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean; role: "athlete" | "coach" | null }> {
    const athlete = await this.getAthleteByEmail(email);
    if (athlete) {
      return { exists: true, role: "athlete" };
    }
    const coach = await this.getCoachByEmail(email);
    if (coach) {
      return { exists: true, role: "coach" };
    }
    return { exists: false, role: null };
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async getMessageThread(athleteId: string, coachId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(eq(messages.athleteId, athleteId), eq(messages.coachId, coachId)))
      .orderBy(messages.createdAt);
  }

  async getAthleteMessageThreads(athleteId: string): Promise<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>> {
    const athleteMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.athleteId, athleteId))
      .orderBy(desc(messages.createdAt));

    const coachIdsSet = new Set(athleteMessages.map(m => m.coachId));
    const coachIds = Array.from(coachIdsSet);

    const threads = await Promise.all(
      coachIds.map(async (coachId) => {
        const coach = await this.getCoach(coachId);
        if (!coach) return null;

        const threadMessages = athleteMessages.filter(m => m.coachId === coachId);
        const lastMessage = threadMessages[0];

        return {
          coach,
          lastMessage,
          unreadCount: 0,
        };
      })
    );

    return threads.filter(Boolean) as Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>;
  }

  async getCoachMessageThreads(coachId: string): Promise<Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>> {
    const coachMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.coachId, coachId))
      .orderBy(desc(messages.createdAt));

    const athleteIdsSet = new Set(coachMessages.map(m => m.athleteId));
    const athleteIds = Array.from(athleteIdsSet);

    const threads = await Promise.all(
      athleteIds.map(async (athleteId) => {
        const athlete = await this.getAthlete(athleteId);
        if (!athlete) return null;

        const threadMessages = coachMessages.filter(m => m.athleteId === athleteId);
        const lastMessage = threadMessages[0];

        return {
          athlete,
          lastMessage,
          unreadCount: 0,
        };
      })
    );

    return threads.filter(Boolean) as Array<{ athlete: Athlete; lastMessage: Message; unreadCount: number }>;
  }

  async createAvailabilitySlot(insertSlot: InsertAvailabilitySlot): Promise<AvailabilitySlot> {
    const result = await db.insert(availabilitySlots).values(insertSlot).returning();
    return result[0];
  }

  async getCoachAvailability(coachId: string): Promise<AvailabilitySlot[]> {
    return await db
      .select()
      .from(availabilitySlots)
      .where(eq(availabilitySlots.coachId, coachId))
      .orderBy(availabilitySlots.date, availabilitySlots.startTime);
  }

  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    await db.delete(availabilitySlots).where(eq(availabilitySlots.id, slotId));
  }

  async clearDayAvailability(coachId: string, date: string): Promise<void> {
    await db
      .delete(availabilitySlots)
      .where(and(eq(availabilitySlots.coachId, coachId), eq(availabilitySlots.date, date)));
    
    await db.insert(availabilitySlots).values({
      coachId,
      date,
      startTime: "UNAVAILABLE",
      endTime: "UNAVAILABLE",
    });
  }

  async getAvailabilitySlotsByIds(slotIds: string[]): Promise<AvailabilitySlot[]> {
    if (slotIds.length === 0) return [];
    return await db
      .select()
      .from(availabilitySlots)
      .where(inArray(availabilitySlots.id, slotIds));
  }

  async createPurchase(insertPurchase: InsertPurchase): Promise<Purchase> {
    const result = await db.insert(purchases).values(insertPurchase).returning();
    return result[0];
  }

  async getPurchase(id: string): Promise<Purchase | undefined> {
    const result = await db.select().from(purchases).where(eq(purchases.id, id));
    return result[0];
  }

  async getPurchasesByAthlete(athleteId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.athleteId, athleteId))
      .orderBy(desc(purchases.createdAt));
  }

  async getPurchasesByCoach(coachId: string): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.coachId, coachId))
      .orderBy(desc(purchases.createdAt));
  }

  async updatePurchaseStatus(id: string, status: PurchaseStatus, providerTransactionId?: string): Promise<Purchase | undefined> {
    const updates: Partial<Purchase> = { 
      status, 
      updatedAt: new Date() 
    };
    if (providerTransactionId) {
      updates.providerTransactionId = providerTransactionId;
    }
    const result = await db
      .update(purchases)
      .set(updates)
      .where(eq(purchases.id, id))
      .returning();
    return result[0];
  }

  async updatePurchaseSession(id: string, sessionId: string): Promise<Purchase | undefined> {
    const result = await db
      .update(purchases)
      .set({ 
        providerSessionId: sessionId,
        updatedAt: new Date() 
      })
      .where(eq(purchases.id, id))
      .returning();
    return result[0];
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoiceByPurchase(purchaseId: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.purchaseId, purchaseId));
    return result[0];
  }

  async updateInvoicePaidAt(id: string, paidAt: Date, receiptUrl?: string): Promise<Invoice | undefined> {
    const updates: Partial<Invoice> = { paidAt };
    if (receiptUrl) {
      updates.providerReceiptUrl = receiptUrl;
    }
    const result = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${year}${month}-${random}`;
  }

  async getInvoicesByCoach(coachId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.coachId, coachId))
      .orderBy(desc(invoices.issuedAt));
  }

  async getInvoicesByAthlete(athleteId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.athleteId, athleteId))
      .orderBy(desc(invoices.issuedAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(insertNotification).returning();
    return result[0];
  }

  async getNotificationsByRecipient(recipientId: string, recipientType: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.recipientType, recipientType)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const result = await db
      .update(notifications)
      .set({ read: "true" })
      .where(eq(notifications.id, id))
      .returning();
    return result[0];
  }

  async getUnreadNotificationCount(recipientId: string, recipientType: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.recipientId, recipientId),
        eq(notifications.recipientType, recipientType),
        eq(notifications.read, "false")
      ));
    return result.length;
  }

  async deleteAvailabilitySlotsByIds(slotIds: string[]): Promise<void> {
    if (slotIds.length === 0) return;
    await db.delete(availabilitySlots).where(inArray(availabilitySlots.id, slotIds));
  }

  async createVerificationCode(insertCode: InsertVerificationCode): Promise<VerificationCode> {
    const result = await db.insert(verificationCodes).values(insertCode).returning();
    return result[0];
  }

  async getVerificationCode(email: string, code: string, role: string): Promise<VerificationCode | undefined> {
    const result = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          ilike(verificationCodes.email, email),
          eq(verificationCodes.code, code),
          eq(verificationCodes.role, role),
          eq(verificationCodes.used, "false")
        )
      )
      .orderBy(desc(verificationCodes.createdAt));
    return result[0];
  }

  async getVerificationCodeByToken(token: string, type: string = "signup"): Promise<VerificationCode | undefined> {
    const result = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.code, token),
          eq(verificationCodes.type, type),
          eq(verificationCodes.used, "false")
        )
      )
      .orderBy(desc(verificationCodes.createdAt));
    return result[0];
  }

  async markVerificationCodeUsed(id: string): Promise<void> {
    await db
      .update(verificationCodes)
      .set({ used: "true" })
      .where(eq(verificationCodes.id, id));
  }

  async deleteExpiredVerificationCodes(): Promise<void> {
    const now = new Date();
    await db.delete(verificationCodes).where(
      and(
        eq(verificationCodes.used, "true")
      )
    );
  }
}


export const storage = new PostgresStorage();
