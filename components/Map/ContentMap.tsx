import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, Maximize, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { 
  buildHierarchy, 
  HierarchyNode, 
  ZOOM_LEVELS, 
  expandNode, 
  collapseNode,
  getVisibleNodes,
  MapViewport
} from '../../services/hierarchicalMap';
import { getKnowledgeBase } from '../../data/knowledgeBase';

interface ContentMapProps {
  onNodeSelect?: (node: HierarchyNode) => void;
  selectedNodeId?: string;
}

export const ContentMap: React.FC<ContentMapProps> = ({ 
  onNodeSelect,
  selectedNodeId 
}) => {
  const [hierarchy, setHierarchy] = useState<HierarchyNode | null>(null);
  const [viewport, setViewport] = useState<MapViewport>({
    x: 50,
    y: 50,
    zoom: 1,
    width: 800,
    height: 600
  });
  const [currentZoomLevel, setCurrentZoomLevel] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HierarchyNode[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Initialize hierarchy
  useEffect(() => {
    const knowledgeBase = getKnowledgeBase();
    const root = buildHierarchy(knowledgeBase);
    setHierarchy(root);
  }, []);

  // Handle zoom
  const handleZoom = (delta: number) => {
    setCurrentZoomLevel(prev => {
      const newLevel = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, prev + delta));
      return newLevel;
    });
  };

  // Handle node expansion
  const handleNodeClick = (node: HierarchyNode) => {
    if (!hierarchy) return;

    if (node.children.length > 0) {
      if (node.visual.expanded) {
        setHierarchy(collapseNode(hierarchy, node.id));
      } else {
        setHierarchy(expandNode(hierarchy, node.id));
      }
    }
    
    onNodeSelect?.(node);
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  };

  // Handle pan
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!hierarchy || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: HierarchyNode[] = [];
    const search = (node: HierarchyNode) => {
      if (node.label.toLowerCase().includes(query.toLowerCase())) {
        results.push(node);
      }
      node.children.forEach(search);
    };
    search(hierarchy);
    setSearchResults(results);
  };

  // Reset view
  const resetView = () => {
    setViewport({
      x: 50,
      y: 50,
      zoom: 1,
      width: 800,
      height: 600
    });
    setCurrentZoomLevel(2);
  };

  // Get visible nodes based on current zoom level
  const visibleNodes = hierarchy 
    ? getVisibleNodes(hierarchy, viewport, ZOOM_LEVELS[currentZoomLevel].granularity)
    : [];

  // Calculate node positions
  const getNodePosition = (node: HierarchyNode) => {
    const level = node.metadata.depth;
    const siblings = hierarchy ? getSiblings(hierarchy, node) : [];
    const index = siblings.findIndex(s => s.id === node.id);
    
    const x = level * 200 + 50;
    const y = index * 80 + 50;
    
    return { x, y };
  };

  // Helper to get siblings
  const getSiblings = (root: HierarchyNode, target: HierarchyNode): HierarchyNode[] => {
    const findParent = (node: HierarchyNode): HierarchyNode | null => {
      for (const child of node.children) {
        if (child.id === target.id) return node;
        const found = findParent(child);
        if (found) return found;
      }
      return null;
    };
    
    const parent = findParent(root);
    return parent ? parent.children : [root];
  };

  if (!hierarchy) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Turinio žemėlapis</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
              {ZOOM_LEVELS[currentZoomLevel].name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Ieškoti..."
              className="pl-8 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          </div>

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(-1)}
            disabled={currentZoomLevel === 0}
            className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            title="Atitolinti"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => handleZoom(1)}
            disabled={currentZoomLevel === ZOOM_LEVELS.length - 1}
            className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            title="Priartinti"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2 hover:bg-gray-200 rounded-lg"
            title="Atstatyti vaizdą"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-3">
          <div className="text-sm text-amber-800 mb-2">
            Rasta {searchResults.length} rezultatų
          </div>
          <div className="flex flex-wrap gap-2">
            {searchResults.slice(0, 5).map(node => (
              <button
                key={node.id}
                onClick={() => onNodeSelect?.(node)}
                className="text-xs bg-white border border-amber-300 px-2 py-1 rounded hover:bg-amber-100"
              >
                {node.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Map canvas */}
      <div 
        ref={containerRef}
        className="relative h-[600px] overflow-hidden bg-gray-50 cursor-move"
        onMouseDown={handleMouseDown}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
          }}
        >
          {/* Connection lines */}
          {visibleNodes.map(node => 
            node.children.map(child => {
              const parentPos = getNodePosition(node);
              const childPos = getNodePosition(child);
              
              return (
                <line
                  key={`${node.id}-${child.id}`}
                  x1={parentPos.x + 60}
                  y1={parentPos.y + 20}
                  x2={childPos.x}
                  y2={childPos.y + 20}
                  stroke="#cbd5e1"
                  strokeWidth={2}
                />
              );
            })
          )}

          {/* Nodes */}
          {visibleNodes.map(node => {
            const pos = getNodePosition(node);
            const isSelected = selectedNodeId === node.id;
            const hasChildren = node.children.length > 0;
            
            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                {/* Node rectangle */}
                <rect
                  width={120}
                  height={40}
                  rx={6}
                  fill={isSelected ? '#f59e0b' : node.visual.color}
                  stroke={isSelected ? '#d97706' : '#94a3b8'}
                  strokeWidth={isSelected ? 3 : 1}
                  className="cursor-pointer transition-all hover:opacity-80"
                  onClick={() => handleNodeClick(node)}
                />
                
                {/* Node label */}
                <text
                  x={60}
                  y={25}
                  textAnchor="middle"
                  fill={isSelected ? 'white' : '#1e293b'}
                  fontSize={12}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  className="pointer-events-none select-none"
                >
                  {truncateText(node.label, 15)}
                </text>
                
                {/* Expand/collapse indicator */}
                {hasChildren && (
                  <g 
                    transform="translate(110, 15)"
                    className="cursor-pointer"
                    onClick={() => handleNodeClick(node)}
                  >
                    <circle r={8} fill="white" stroke="#94a3b8" />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fontSize={10}
                      fill="#64748b"
                    >
                      {node.visual.expanded ? '−' : '+'}
                    </text>
                  </g>
                )}
                
                {/* Word count badge */}
                {node.metadata.wordCount > 0 && (
                  <text
                    x={60}
                    y={52}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={10}
                  >
                    {node.metadata.wordCount} žodžių
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Žymėjimas</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#1a365d' }} />
              <span>Korpusas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#2c5282' }} />
              <span>Šaltinis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#2b6cb0' }} />
              <span>Knyga</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ background: '#3182ce' }} />
              <span>Skyrius</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 flex items-center gap-6 text-sm text-gray-600">
        <span>Viso mazgų: {visibleNodes.length}</span>
        <span>Viso žodžių: {hierarchy.metadata.wordCount.toLocaleString()}</span>
        <span>Išplėsta: {visibleNodes.filter(n => n.visual.expanded).length}</span>
      </div>
    </div>
  );
};

// Helper function
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export default ContentMap;