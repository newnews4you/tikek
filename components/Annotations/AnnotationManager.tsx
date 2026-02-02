import React, { useState, useEffect } from 'react';
import {
  Highlighter,
  StickyNote,
  Bookmark,
  Trash2,
  Edit2,
  Download,
  Upload,
  Filter,
  Search,
  X,
  Check,
  Palette,
  Tag
} from 'lucide-react';
import {
  getUserAnnotations,
  deleteAnnotation,
  updateAnnotation,
  createAnnotationGroup,
  getAnnotationGroups,
  exportAnnotations,
  importAnnotations,
  HIGHLIGHT_COLORS,
  Annotation,
  AnnotationGroup
} from '../../services/annotations';
import { downloadExport } from '../../services/export';

interface AnnotationManagerProps {
  userId: string;
  onAnnotationSelect?: (annotation: Annotation) => void;
}

export const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  userId,
  onAnnotationSelect
}) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [groups, setGroups] = useState<AnnotationGroup[]>([]);
  const [filter, setFilter] = useState<'all' | 'highlight' | 'note' | 'bookmark'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    loadAnnotations();
    loadGroups();
  }, [userId]);

  const loadAnnotations = async () => {
    const userAnnotations = await getUserAnnotations(userId);
    setAnnotations(userAnnotations.sort((a, b) => b.createdAt - a.createdAt));
  };

  const loadGroups = () => {
    const userGroups = getAnnotationGroups(userId);
    setGroups(userGroups);
  };

  const handleDelete = async (annotationId: string) => {
    if (confirm('Ar tikrai norite ištrinti šią anotaciją?')) {
      await deleteAnnotation(annotationId);
      await loadAnnotations();
    }
  };

  const handleEdit = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id);
    setEditContent(annotation.content || '');
  };

  const handleSaveEdit = async (annotationId: string) => {
    await updateAnnotation(annotationId, { content: editContent });
    setEditingAnnotation(null);
    await loadAnnotations();
  };

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const content = exportAnnotations(annotations, format);
    const filename = `annotations-${new Date().toISOString().split('T')[0]}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/plain';
    downloadExport(content, filename, mimeType);
  };

  const handleImport = async () => {
    const result = await importAnnotations(userId, importData);
    alert(`Importuota: ${result.imported}, Klaidų: ${result.errors.length}`);
    setShowImportDialog(false);
    setImportData('');
    await loadAnnotations();
  };

  const handleCreateGroup = async () => {
    const name = prompt('Grupės pavadinimas:');
    if (name) {
      await createAnnotationGroup(userId, name);
      loadGroups();
    }
  };

  const filteredAnnotations = annotations.filter(annotation => {
    // Type filter
    if (filter !== 'all' && annotation.type !== filter) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesText = annotation.range.selectedText.toLowerCase().includes(query);
      const matchesContent = annotation.content?.toLowerCase().includes(query);
      const matchesSource = annotation.source.toLowerCase().includes(query);
      const matchesBook = annotation.bookOrSection.toLowerCase().includes(query);
      
      if (!matchesText && !matchesContent && !matchesSource && !matchesBook) return false;
    }
    
    // Group filter
    if (selectedGroup) {
      const group = groups.find(g => g.id === selectedGroup);
      if (!group?.annotationIds.includes(annotation.id)) return false;
    }
    
    return true;
  });

  const getTypeIcon = (type: Annotation['type']) => {
    switch (type) {
      case 'highlight':
        return <Highlighter size={16} />;
      case 'note':
        return <StickyNote size={16} />;
      case 'bookmark':
        return <Bookmark size={16} />;
      default:
        return <Tag size={16} />;
    }
  };

  const getTypeLabel = (type: Annotation['type']) => {
    switch (type) {
      case 'highlight':
        return 'Pažymėjimas';
      case 'note':
        return 'Pastaba';
      case 'bookmark':
        return 'Žymė';
      default:
        return 'Žyma';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Highlighter size={20} />
            Mano anotacijos
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('json')}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded"
              title="Eksportuoti"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded"
              title="Importuoti"
            >
              <Upload size={18} />
            </button>
          </div>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          {annotations.length} anotacijų
        </p>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-200 p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ieškoti anotacijų..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'highlight', 'note', 'bookmark'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'Visos' : getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 py-1">Grupės:</span>
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedGroup === null
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visos
            </button>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedGroup === group.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {group.name}
              </button>
            ))}
            <button
              onClick={handleCreateGroup}
              className="px-3 py-1 rounded-full text-sm border border-dashed border-gray-400 text-gray-600 hover:border-blue-500 hover:text-blue-600"
            >
              + Nauja grupė
            </button>
          </div>
        )}
      </div>

      {/* Annotations list */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Highlighter size={48} className="mx-auto mb-4 opacity-50" />
            <p>Anotacijų nerasta</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredAnnotations.map(annotation => (
              <div
                key={annotation.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="p-1.5 rounded"
                      style={{
                        background: annotation.color || HIGHLIGHT_COLORS[0].value,
                        color: annotation.type === 'highlight' ? '#000' : 'inherit'
                      }}
                    >
                      {getTypeIcon(annotation.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTypeLabel(annotation.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(annotation)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(annotation.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div className="mt-2 text-sm text-gray-600">
                  {annotation.source} • {annotation.bookOrSection} {annotation.chapterOrRef}
                </div>

                {/* Selected text */}
                <div
                  className="mt-2 p-2 rounded text-sm cursor-pointer"
                  style={{ background: annotation.color || '#fef3c7' }}
                  onClick={() => onAnnotationSelect?.(annotation)}
                >
                  "{annotation.range.selectedText}"
                </div>

                {/* Note content */}
                {annotation.type === 'note' && (
                  <div className="mt-2">
                    {editingAnnotation === annotation.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(annotation.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            <Check size={14} className="inline mr-1" />
                            Išsaugoti
                          </button>
                          <button
                            onClick={() => setEditingAnnotation(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                          >
                            <X size={14} className="inline mr-1" />
                            Atšaukti
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700">{annotation.content}</p>
                    )}
                  </div>
                )}

                {/* Tags */}
                {annotation.tags && annotation.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {annotation.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(annotation.createdAt).toLocaleString()}
                  {!annotation.synced && (
                    <span className="ml-2 text-amber-600">• Nesinchronizuota</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Importuoti anotacijas</h3>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Įklijuokite JSON formato anotacijas..."
              className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Atšaukti
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Importuoti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationManager;