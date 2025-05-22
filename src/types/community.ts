
export interface CommunityUser {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string | null;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author: CommunityUser;
  createdAt: Date;
  likes: number;
  replies: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  user: CommunityUser;
  createdAt: Date;
}
