export enum Sender {
  USER = 'USER',
  AI = 'AI'
}

export enum RagState {
  IDLE = 'IDLE',
  RETRIEVING = 'RETRIEVING',
  ANALYZING = 'ANALYZING',
  GENERATING = 'GENERATING'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Citation {
  source: string;
  reference: string;
  snippet?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  citations?: Citation[];
  isStreaming?: boolean;
  image?: string; 
  suggestions?: string[];
  groundingSources?: GroundingSource[]; // New field for Real RAG links
}

export interface RagDocument {
  title: string;
  type: 'BIBLE' | 'CATECHISM' | 'ENCYCLICAL' | 'SAINT';
  icon: string;
}