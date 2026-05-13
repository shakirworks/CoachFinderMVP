export interface Athlete {
  id: string;
  name: string;
  sport: string;
  location: string;
  email: string;
  emailVerified?: string;
  profileImage?: string | null;
  availableForCoachRequests?: string;
  gender?: string | null;
  age?: string | null;
  skillLevel?: string | null;
  preferredCoachGender?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Coach {
  id: string;
  name: string;
  sport: string;
  location: string;
  email: string;
  emailVerified?: string;
  profileImage?: string | null;
  certification?: string | null;
  certificationFileUrl?: string | null;
  performanceLevel?: string | null;
  age?: string | null;
  gender?: string | null;
  bio?: string | null;
  hourlyRate?: string | null;
  coachingOptions?: string[] | null;
  yearsOfExperience?: string | null;
  studentLevels?: string[] | null;
  stripeAccountId?: string | null;
  stripeAccountStatus?: string | null;
  stripeOnboardingComplete?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  trainingLocation?: string | null;
}

export interface Message {
  id: string;
  athleteId: string;
  coachId: string;
  message: string;
  senderType: 'athlete' | 'coach';
  createdAt: string;
}

export interface AvailabilitySlot {
  id: string;
  coachId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
}

export interface Invoice {
  id: string;
  purchaseId: string;
  invoiceNumber: string;
  athleteId: string;
  coachId: string;
  athleteName: string;
  athleteEmail: string;
  coachName: string;
  coachEmail: string;
  subtotal: number;
  serviceFee: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  sessionDetails: Array<{
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  issuedAt: string;
  paidAt?: string | null;
  providerReceiptUrl?: string | null;
}

export interface MessageThread {
  coach: Coach;
  lastMessage: Message;
  unreadCount: number;
}

export interface CoachMessageThread {
  athlete: Athlete;
  lastMessage: Message;
  unreadCount: number;
}

export interface BookingQuote {
  coachId: string;
  coachName: string;
  hourlyRate: number;
  slots: Array<{
    slotId: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  subtotal: number;
  serviceFee: number;
  serviceFeePercentage: number;
  taxAmount: number;
  taxPercentage: number;
  totalAmount: number;
  currency: string;
}

export interface CheckoutSession {
  url: string;
  purchaseId: string;
  sessionId: string;
}
