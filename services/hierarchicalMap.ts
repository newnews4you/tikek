/**
 * Hierarchical Content Map Service
 * Provides dynamic zoom from chapter to word level with visualization
 */

import { KnowledgeChunk } from '../data/knowledgeBase';

export interface HierarchyNode {
  id: string;
  type: 'corpus' | 'source' | 'book' | 'chapter' | 'section' | 'verse' | 'word';
  label: string;
  content?: string;
  children: HierarchyNode[];
  metadata: {
    wordCount: number;
    depth: number;
    path: string[];
    stats?: {
      totalVerses?: number;
      totalChapters?: number;
      uniqueWords?: number;
    };
  };
  visual: {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    expanded: boolean;
  };
}

export interface ZoomLevel {
  level: number;
  name: string;
  granularity: 'corpus' | 'source' | 'book' | 'chapter' | 'verse' | 'word';
  visibleRange: { start: number; end: number };
}

export interface MapViewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

// Color scheme for different content types
const TYPE_COLORS: Record<string, string> = {
  corpus: '#1a365d',
  source: '#2c5282',
  book: '#2b6cb0',
  chapter: '#3182ce',
  section: '#4299e1',
  verse: '#63b3ed',
  word: '#90cdf4'
};

/**
 * Builds hierarchical tree from knowledge base
 */
export const buildHierarchy = (knowledgeBase: KnowledgeChunk[]): HierarchyNode => {
  const root: HierarchyNode = {
    id: 'root',
    type: 'corpus',
    label: 'Tekstų Korpusas',
    children: [],
    metadata: {
      wordCount: 0,
      depth: 0,
      path: [],
      stats: {
        totalVerses: 0,
        totalChapters: 0,
        uniqueWords: 0
      }
    },
    visual: {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: TYPE_COLORS.corpus,
      expanded: true
    }
  };
  
  // Group by source
  const bySource = groupBy(knowledgeBase, 'source');
  
  for (const [sourceName, sourceChunks] of Object.entries(bySource)) {
    const sourceNode: HierarchyNode = {
      id: `source-${sourceName}`,
      type: 'source',
      label: sourceName,
      children: [],
      metadata: {
        wordCount: 0,
        depth: 1,
        path: [sourceName]
      },
      visual: {
        x: 0,
        y: 0,
        width: 80,
        height: 60,
        color: TYPE_COLORS.source,
        expanded: false
      }
    };
    
    // Group by book/section within source
    const byBook = groupBy(sourceChunks, 'bookOrSection');
    
    for (const [bookName, bookChunks] of Object.entries(byBook)) {
      const bookNode: HierarchyNode = {
        id: `book-${sourceName}-${bookName}`,
        type: 'book',
        label: bookName,
        children: [],
        metadata: {
          wordCount: 0,
          depth: 2,
          path: [sourceName, bookName],
          stats: {
            totalChapters: new Set(bookChunks.map(c => c.chapterOrRef)).size
          }
        },
        visual: {
          x: 0,
          y: 0,
          width: 60,
          height: 40,
          color: TYPE_COLORS.book,
          expanded: false
        }
      };
      
      // Add chapters/sections
      for (const chunk of bookChunks) {
        const wordCount = chunk.content.split(/\s+/).length;
        
        const chapterNode: HierarchyNode = {
          id: chunk.id || `chapter-${sourceName}-${bookName}-${chunk.chapterOrRef}`,
          type: 'chapter',
          label: chunk.chapterOrRef,
          content: chunk.content,
          children: [], // Can be expanded to verses/words
          metadata: {
            wordCount,
            depth: 3,
            path: [sourceName, bookName, chunk.chapterOrRef]
          },
          visual: {
            x: 0,
            y: 0,
            width: 40,
            height: 30,
            color: TYPE_COLORS.chapter,
            expanded: false
          }
        };
        
        // Parse verses if content contains verse references
        const verses = parseVerses(chunk.content);
        if (verses.length > 0) {
          chapterNode.children = verses.map((verse, idx) => ({
            id: `${chapterNode.id}-verse-${idx}`,
            type: 'verse',
            label: verse.reference,
            content: verse.text,
            children: [], // Can expand to words
            metadata: {
              wordCount: verse.text.split(/\s+/).length,
              depth: 4,
              path: [...chapterNode.metadata.path, verse.reference]
            },
            visual: {
              x: 0,
              y: 0,
              width: 30,
              height: 20,
              color: TYPE_COLORS.verse,
              expanded: false
            }
          }));
        }
        
        bookNode.children.push(chapterNode);
        bookNode.metadata.wordCount += wordCount;
      }
      
      sourceNode.children.push(bookNode);
      sourceNode.metadata.wordCount += bookNode.metadata.wordCount;
    }
    
    root.children.push(sourceNode);
    root.metadata.wordCount += sourceNode.metadata.wordCount;
  }
  
  // Calculate positions using tree layout algorithm
  calculatePositions(root, 0, 0, 100);
  
  return root;
};

/**
 * Groups array of objects by key
 */
const groupBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Parses verses from biblical text content
 */
const parseVerses = (content: string): Array<{ reference: string; text: string }> => {
  const verses: Array<{ reference: string; text: string }> = [];
  
  // Match patterns like "1 Text..." or "[1:1] Text..."
  const patterns = [
    /(\d+)\s+([^\d]+?)(?=\d+\s+|$)/g,
    /\[(\d+:\d+)\]\s*([^\[]+)/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      verses.push({
        reference: match[1],
        text: match[2].trim()
      });
    }
    
    if (verses.length > 0) break;
  }
  
  return verses;
};

/**
 * Calculates visual positions for tree nodes
 */
const calculatePositions = (
  node: HierarchyNode,
  x: number,
  y: number,
  availableWidth: number
): void => {
  node.visual.x = x;
  node.visual.y = y;
  
  if (node.children.length === 0 || !node.visual.expanded) {
    return;
  }
  
  const childWidth = availableWidth / node.children.length;
  const childY = y + node.visual.height + 10;
  
  node.children.forEach((child, index) => {
    const childX = x + (index * childWidth) + (childWidth / 2) - (child.visual.width / 2);
    calculatePositions(child, childX, childY, childWidth * 0.9);
  });
};

/**
 * Zoom levels configuration
 */
export const ZOOM_LEVELS: ZoomLevel[] = [
  { level: 0, name: 'Korpusas', granularity: 'corpus', visibleRange: { start: 0, end: 100 } },
  { level: 1, name: 'Šaltiniai', granularity: 'source', visibleRange: { start: 0, end: 80 } },
  { level: 2, name: 'Knygos', granularity: 'book', visibleRange: { start: 0, end: 60 } },
  { level: 3, name: 'Skyriai', granularity: 'chapter', visibleRange: { start: 0, end: 40 } },
  { level: 4, name: 'Eilutės', granularity: 'verse', visibleRange: { start: 0, end: 25 } },
  { level: 5, name: 'Žodžiai', granularity: 'word', visibleRange: { start: 0, end: 10 } }
];

/**
 * Gets visible nodes at current zoom level
 */
export const getVisibleNodes = (
  root: HierarchyNode,
  viewport: MapViewport,
  targetGranularity: 'corpus' | 'source' | 'book' | 'chapter' | 'verse' | 'word'
): HierarchyNode[] => {
  const visible: HierarchyNode[] = [];
  
  const traverse = (node: HierarchyNode) => {
    // Check if node is within viewport
    const nodeLeft = node.visual.x * viewport.zoom + viewport.x;
    const nodeRight = (node.visual.x + node.visual.width) * viewport.zoom + viewport.x;
    const nodeTop = node.visual.y * viewport.zoom + viewport.y;
    const nodeBottom = (node.visual.y + node.visual.height) * viewport.zoom + viewport.y;
    
    const isVisible = nodeRight > 0 && 
                      nodeLeft < viewport.width && 
                      nodeBottom > 0 && 
                      nodeTop < viewport.height;
    
    if (isVisible) {
      // Include node if it matches target granularity or is a parent
      if (node.type === targetGranularity || 
          (node.children.length > 0 && shouldShowAsParent(node.type, targetGranularity))) {
        visible.push(node);
      }
      
      // Traverse children if expanded and we're not at target granularity
      if (node.visual.expanded && node.children.length > 0) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
  };
  
  traverse(root);
  return visible;
};

/**
 * Determines if a parent node should be shown at target granularity
 */
const shouldShowAsParent = (
  parentType: string,
  targetGranularity: string
): boolean => {
  const hierarchy = ['corpus', 'source', 'book', 'chapter', 'verse', 'word'];
  const parentIndex = hierarchy.indexOf(parentType);
  const targetIndex = hierarchy.indexOf(targetGranularity);
  return parentIndex < targetIndex;
};

/**
 * Expands a node to show its children
 */
export const expandNode = (root: HierarchyNode, nodeId: string): HierarchyNode => {
  const updateNode = (node: HierarchyNode): HierarchyNode => {
    if (node.id === nodeId) {
      return {
        ...node,
        visual: { ...node.visual, expanded: true },
        children: node.children.map(child => ({
          ...child,
          visual: { ...child.visual, expanded: false }
        }))
      };
    }
    
    return {
      ...node,
      children: node.children.map(updateNode)
    };
  };
  
  const updated = updateNode(root);
  calculatePositions(updated, 0, 0, 100);
  return updated;
};

/**
 * Collapses a node to hide its children
 */
export const collapseNode = (root: HierarchyNode, nodeId: string): HierarchyNode => {
  const updateNode = (node: HierarchyNode): HierarchyNode => {
    if (node.id === nodeId) {
      return {
        ...node,
        visual: { ...node.visual, expanded: false }
      };
    }
    
    return {
      ...node,
      children: node.children.map(updateNode)
    };
  };
  
  const updated = updateNode(root);
  calculatePositions(updated, 0, 0, 100);
  return updated;
};

/**
 * Finds a node by ID in the hierarchy
 */
export const findNodeById = (root: HierarchyNode, nodeId: string): HierarchyNode | null => {
  if (root.id === nodeId) {
    return root;
  }
  
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  
  return null;
};

/**
 * Gets the path from root to a specific node
 */
export const getNodePath = (root: HierarchyNode, nodeId: string): HierarchyNode[] => {
  const path: HierarchyNode[] = [];
  
  const findPath = (node: HierarchyNode): boolean => {
    path.push(node);
    
    if (node.id === nodeId) {
      return true;
    }
    
    for (const child of node.children) {
      if (findPath(child)) {
        return true;
      }
    }
    
    path.pop();
    return false;
  };
  
  findPath(root);
  return path;
};

/**
 * Searches within the hierarchy
 */
export const searchHierarchy = (
  root: HierarchyNode,
  query: string
): HierarchyNode[] => {
  const results: HierarchyNode[] = [];
  const queryLower = query.toLowerCase();
  
  const search = (node: HierarchyNode) => {
    const match = 
      node.label.toLowerCase().includes(queryLower) ||
      (node.content && node.content.toLowerCase().includes(queryLower));
    
    if (match) {
      results.push(node);
    }
    
    for (const child of node.children) {
      search(child);
    }
  };
  
  search(root);
  return results;
};

/**
 * Gets statistics for a node
 */
export const getNodeStats = (node: HierarchyNode) => {
  const stats = {
    totalNodes: 0,
    totalWords: 0,
    maxDepth: 0,
    byType: {} as Record<string, number>
  };
  
  const traverse = (n: HierarchyNode, depth: number) => {
    stats.totalNodes++;
    stats.totalWords += n.metadata.wordCount;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    
    for (const child of n.children) {
      traverse(child, depth + 1);
    }
  };
  
  traverse(node, 0);
  return stats;
};

/**
 * Exports hierarchy to various formats
 */
export const exportHierarchy = (
  root: HierarchyNode,
  format: 'json' | 'csv' | 'xml'
): string => {
  switch (format) {
    case 'json':
      return JSON.stringify(root, null, 2);
    
    case 'csv':
      const rows: string[] = ['id,type,label,wordCount,depth,path'];
      
      const traverse = (node: HierarchyNode) => {
        rows.push(`${node.id},${node.type},"${node.label}",${node.metadata.wordCount},${node.metadata.depth},"${node.metadata.path.join(' > ')}"`);
        node.children.forEach(traverse);
      };
      
      traverse(root);
      return rows.join('\n');
    
    case 'xml':
      const buildXML = (node: HierarchyNode, indent: string = ''): string => {
        const attrs = `id="${node.id}" type="${node.type}" words="${node.metadata.wordCount}"`;
        let xml = `${indent}<node ${attrs} label="${node.label}">\n`;
        
        if (node.content) {
          xml += `${indent}  <content><![CDATA[${node.content.slice(0, 200)}...]]></content>\n`;
        }
        
        for (const child of node.children) {
          xml += buildXML(child, indent + '  ');
        }
        
        xml += `${indent}</node>\n`;
        return xml;
      };
      
      return `<?xml version="1.0" encoding="UTF-8"?>\n<hierarchy>\n${buildXML(root)}</hierarchy>`;
    
    default:
      return '';
  }
};