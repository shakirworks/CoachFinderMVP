import { type Athlete, type InsertAthlete, type Coach, type InsertCoach, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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

    coaches.forEach(coach => {
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

export const storage = new MemStorage();
