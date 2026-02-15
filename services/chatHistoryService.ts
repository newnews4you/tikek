import { Message } from '../types';

export interface ChatConversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

const STORAGE_KEY = 'tikek_chat_history';
const MAX_CONVERSATIONS = 50;

function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getTitle(messages: Message[]): string {
    const firstUserMsg = messages.find(m => m.sender === 'USER');
    if (!firstUserMsg) return 'Naujas pokalbis';
    const text = firstUserMsg.text.replace(/\*\*/g, '').trim();
    return text.length > 60 ? text.slice(0, 57) + '...' : text;
}

export function getAllConversations(): ChatConversation[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const convos: ChatConversation[] = JSON.parse(raw);
        return convos.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
        return [];
    }
}

export function saveConversation(id: string | null, messages: Message[]): string {
    // Don't save if only the welcome message exists
    if (messages.length <= 1) return id || '';

    const convos = getAllConversations();
    const title = getTitle(messages);
    const now = Date.now();

    if (id) {
        const idx = convos.findIndex(c => c.id === id);
        if (idx >= 0) {
            convos[idx].messages = messages;
            convos[idx].title = title;
            convos[idx].updatedAt = now;
        } else {
            convos.unshift({ id, title, messages, createdAt: now, updatedAt: now });
        }
    } else {
        id = generateId();
        convos.unshift({ id, title, messages, createdAt: now, updatedAt: now });
    }

    // Keep only the most recent conversations
    const trimmed = convos.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return id;
}

export function loadConversation(id: string): ChatConversation | null {
    const convos = getAllConversations();
    return convos.find(c => c.id === id) || null;
}

export function deleteConversation(id: string): void {
    const convos = getAllConversations().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

export function clearAllHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}
