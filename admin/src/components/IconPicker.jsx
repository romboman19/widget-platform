import React, { useEffect, useState } from 'react';
import { Search, X, Folder, Image } from 'lucide-react';

/**
 * IconPicker — вибір іконки з Media Library
 * 
 * Props:
 * - value: string | null — поточний iconId (mediaFile.id або slug для дефолтних)
 * - onChange: (iconId: string | null) => void
 * - api: функція для API-запитів
 * - channelType?: string — фільтр по типу каналу (optional)
 */
export default function IconPicker({ value, onChange, api, channelType }) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load folders and files when opened
  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen, selectedFolder]);

  async function loadData() {
    setLoading(true);
    try {
      // Load folders
      const foldersData = await api('/media/folders');
      setFolders(foldersData || []);

      // Load files
      const params = new URLSearchParams();
      if (selectedFolder) params.set('folder', selectedFolder);
      params.set('includeDefaults', 'true');
      
      const filesData = await api(`/media?${params}`);
      setFiles(filesData || []);
    } catch (e) {
      console.error('Failed to load media:', e);
    } finally {
      setLoading(false);
    }
  }

  // Filter files by search query
  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get currently selected file info
  const selectedFile = files.find(f => f.id === value || f.slug === value);

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        {selectedFile ? (
          <>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <img 
                src={selectedFile.url} 
                alt={selectedFile.name}
                className="w-8 h-8 object-contain"
              />
              <span className="text-sm text-slate-600 truncate max-w-[150px]">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => onChange(null)}
              className="p-1.5 text-slate-400 hover:text-red-500"
              title="Прибрати іконку"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
          >
            <Image size={16} /> Вибрати іконку
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">Вибір іконки</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Пошук іконок..."
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Folder tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                selectedFolder === null 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Folder size={14} /> Всі
            </button>
            
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
                  selectedFolder === folder.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Folder size={14} /> {folder.name}
              </button>
            ))}
          </div>
        </div>

        {/* Files grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Завантаження...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              {searchQuery ? 'Нічого не знайдено' : 'Немає іконок'}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {filteredFiles.map(file => (
                <button
                  key={file.id}
                  onClick={() => {
                    // Use id for user files, slug for defaults
                    const iconId = file.isDefault ? file.slug : file.id;
                    onChange(iconId);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-lg border text-center hover:bg-slate-50 transition-colors ${
                    (value === file.id || value === file.slug)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-slate-200'
                  }`}
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-10 h-10 mx-auto mb-2 object-contain"
                  />
                  <span className="text-xs text-slate-600 truncate block">{file.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-between">
          <button
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Без іконки
          </button>
          
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
