export interface ChatSummary {
  id: number;
  title: string;
  created_at?: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender: string;
  content: string;
  image_url?: string | null;
  created_at?: string;
}
