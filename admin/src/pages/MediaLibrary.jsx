import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen, Folder, Upload, Trash2, Plus, Image as ImageIcon, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function MediaLibrary() {
  const { api } = useAuth();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const loadFolders = useCallback(async () => {
    try {
      setFolders(await api('/media/folders') || []);
    } catch (e) { console.error('Failed to load folders:', e); }
  }, [api]);

  const loadFiles = useCallback(async () => {
    try {
      const params = selectedFolder
        ? `?folder=${selectedFolder}&includeDefaults=true`
        : '?includeDefaults=true';
      setFiles(await api(`/media${params}`) || []);
    } catch (e) { console.error('Failed to load files:', e); }
  }, [api, selectedFolder]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function uploadFile(file) {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (selectedFolder) fd.append('folderId', selectedFolder);
      fd.append('subtype', 'icon');
      await api('/media', { method: 'POST', body: fd });
      await loadFiles();
      await loadFolders();
    } catch (e) {
      setError('Помилка завантаження: ' + (e.message || 'невідома помилка'));
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function deleteFile(id) {
    if (!confirm('Видалити цей файл?')) return;
    try {
      await api(`/media/${id}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== id));
    } catch (e) {
      setError('Не вдалося видалити: ' + (e.message || 'невідома помилка'));
    }
  }

  async function createFolder() {
    const name = prompt('Назва папки:');
    if (!name?.trim()) return;
    try {
      await api('/media/folders', { method: 'POST', body: { name: name.trim() } });
      await loadFolders();
    } catch (e) {
      setError('Не вдалося створити папку: ' + (e.message || 'невідома помилка'));
    }
  }

  async function deleteFolder(folder) {
    if ((folder._count?.files || 0) > 0) { alert('Папка не порожня — спочатку видаліть файли'); return; }
    if ((folder.children?.length || 0) > 0) { alert('Папка містить підпапки'); return; }
    if (!confirm(`Видалити папку "${folder.name}"?`)) return;
    try {
      await api(`/media/folders/${folder.id}`, { method: 'DELETE' });
      await loadFolders();
      if (selectedFolder === folder.id) setSelectedFolder(null);
    } catch (e) {
      setError('Не вдалося видалити папку: ' + (e.message || 'невідома помилка'));
    }
  }

  const currentName = selectedFolder
    ? (folders.find(f => f.id === selectedFolder)?.name || 'Папка')
    : 'Усі файли';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Бібліотека файлів</h1>
        <div className="flex gap-2">
          <button onClick={createFolder}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Plus size={16} /> Нова папка
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Upload size={16} /> {uploading ? 'Завантаження…' : 'Завантажити файл'}
          </button>
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".svg,.png,.jpg,.jpeg,.webp,.gif" onChange={handleInputChange} />
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Folders sidebar */}
        <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-slate-200 p-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Папки</h2>
          <button onClick={() => setSelectedFolder(null)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedFolder === null ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FolderOpen size={16} /> Усі файли
          </button>
          {folders.map(folder => (
            <div key={folder.id} className="group flex items-center gap-1">
              <button onClick={() => setSelectedFolder(folder.id)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedFolder === folder.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Folder size={16} />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto text-xs text-slate-400">{folder._count?.files ?? 0}</span>
              </button>
              <button onClick={() => deleteFolder(folder)}
                className="p-1.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                title="Видалити папку">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Files area */}
        <div className="flex-1">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`bg-white rounded-xl border p-5 transition-colors ${dragOver ? 'border-blue-400 border-dashed bg-blue-50/40' : 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <FolderOpen size={18} className="text-slate-400" /> {currentName}
                <span className="text-sm font-normal text-slate-400">({files.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Перетягніть файл сюди для завантаження</span>
            </div>

            {files.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Upload size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Немає файлів. Перетягніть сюди або натисніть «Завантажити файл».</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.map(file => (
                  <div key={file.id}
                    className="group relative bg-slate-50 rounded-xl border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="aspect-square flex items-center justify-center p-4 bg-white">
                      <img src={file.url} alt={file.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                      <div className="hidden w-full h-full items-center justify-center text-slate-300">
                        {file.type === 'SVG' ? <FileText size={28} /> : <ImageIcon size={28} />}
                      </div>
                    </div>
                    <div className="p-2.5 border-t border-slate-100">
                      <p className="text-xs text-slate-600 truncate" title={file.name}>{file.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">{file.type}</span>
                        {!file.isDefault && (
                          <button onClick={() => deleteFile(file.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors" title="Видалити">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

