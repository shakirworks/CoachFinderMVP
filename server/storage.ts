import { type Athlete, type InsertAthlete, type Coach, type InsertCoach, type Message, type InsertMessage, athletes, coaches, messages } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getAthlete(id: string): Promise<Athlete | undefined>;
  getAthleteByEmail(email: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  updateAthlete(id: string, updates: Partial<InsertAthlete>): Promise<Athlete | undefined>;
  getAllAthletes(): Promise<Athlete[]>;
  
  getCoach(id: string): Promise<Coach | undefined>;
  getCoachByEmail(email: string): Promise<Coach | undefined>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  getAllCoaches(): Promise<Coach[]>;

  createMessage(message: InsertMessage): Promise<Message>;
  getMessageThread(athleteId: string, coachId: string): Promise<Message[]>;
  getAthleteMessageThreads(athleteId: string): Promise<Array<{ coach: Coach; lastMessage: Message; unreadCount: number }>>;
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
      };
      this.coaches.set(id, coachData);
    });
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    return this.athletes.get(id);
  }

  async getAthleteByEmail(email: string): Promise<Athlete | undefined> {
    return Array.from(this.athletes.values()).find(
      (athlete) => athlete.email === email,
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
      profileImage: insertAthlete.profileImage ?? null,
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

  async getAllAthletes(): Promise<Athlete[]> {
    return Array.from(this.athletes.values());
  }

  async getCoach(id: string): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }

  async getCoachByEmail(email: string): Promise<Coach | undefined> {
    return Array.from(this.coaches.values()).find(
      (coach) => coach.email === email,
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
    };
    this.coaches.set(id, coach);
    return coach;
  }

  async getAllCoaches(): Promise<Coach[]> {
    return Array.from(this.coaches.values());
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
}

export class PostgresStorage implements IStorage {
  async getAthlete(id: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.id, id));
    return result[0];
  }

  async getAthleteByEmail(email: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.email, email));
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

  async getAllAthletes(): Promise<Athlete[]> {
    return await db.select().from(athletes);
  }

  async getCoach(id: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches).where(eq(coaches.id, id));
    return result[0];
  }

  async getCoachByEmail(email: string): Promise<Coach | undefined> {
    const result = await db.select().from(coaches).where(eq(coaches.email, email));
    return result[0];
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const result = await db.insert(coaches).values(insertCoach).returning();
    return result[0];
  }

  async getAllCoaches(): Promise<Coach[]> {
    return await db.select().from(coaches);
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
}

async function initializeDummyData() {
  const existingCoaches = await db.select().from(coaches);
  if (existingCoaches.length > 0) {
    return;
  }

  const coachesData = [
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

  for (let i = 0; i < coachesData.length; i++) {
    const coach = coachesData[i];
    await db.insert(coaches).values({
      name: coach.name,
      sport: coach.sport,
      location: coach.location,
      email: coach.email,
      hourlyRate: hourlyRates[i % hourlyRates.length],
      coachingOptions: coachingOptionsOptions[i % coachingOptionsOptions.length],
      yearsOfExperience: experienceYears[i % experienceYears.length],
      studentLevels: studentLevelsOptions[i % studentLevelsOptions.length],
    });
  }
}

initializeDummyData().catch(console.error);

export const storage = new PostgresStorage();
