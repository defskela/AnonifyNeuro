export interface ChatSummary {
    id: number;
    title: string;
    created_at?: string;
}

export interface ChatDetails {
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
