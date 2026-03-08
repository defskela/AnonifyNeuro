export interface ChatSummary {
    id: number;
    title: string;
    created_at?: string;
    owner_id?: number;
    owner_username?: string;
    messages_count?: number;
    has_images?: boolean;
    last_activity_at?: string | null;
}

export interface ChatDetails {
    id: number;
    title: string;
    created_at?: string;
}

export interface ChatListResponse {
    items: ChatSummary[];
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface ChatListParams {
    q?: string;
    owner_id?: number;
    created_from?: string;
    created_to?: string;
    has_images?: boolean;
    min_messages?: number;
    sort_by?: 'created_at' | 'title' | 'messages_count' | 'last_activity_at';
    sort_order?: 'asc' | 'desc';
    page?: number;
    page_size?: number;
}

export interface Message {
    id: number;
    chat_id: number;
    sender: string;
    content: string;
    image_url?: string | null;
    created_at?: string;
}

export interface BoundingBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    confidence: number;
}

export interface RedactResponse {
    task_id: string;
    status: string;
    detections_count: number;
    detections: BoundingBox[];
    original_image_url?: string | null;
    redacted_image_base64?: string | null;
    redacted_image_url?: string | null;
}

export interface ChatFile {
    id: number;
    chat_id: number;
    uploaded_by: number;
    filename: string;
    content_type: string;
    size: number;
    created_at: string;
}
