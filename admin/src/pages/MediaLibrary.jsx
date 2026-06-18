import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Upload, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function MediaLibrary() {
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Завантажити папки
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await api('/media/folders');
        setFolders(data);
      } catch (err) {
        console.error('Failed to fetch folders:', err);
      }
    };
    fetchFolders();
  }, []);
  
  // Завантажити файли
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const params = selectedFolder ? `?folder=${selectedFolder}&includeDefaults=true` : '?includeDefaults=true';
        const data = await api(`/media${params}`);
        setFiles(data);
      } catch (err) {
        console.error('Failed to fetch files:', err);
      }
    };
    fetchFiles();
  }, [selectedFolder, api]);
  
  // Завантажити файл
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', selectedFolder || '');
      formData.append('subtype', 'icon');
      
      await api('/media', {
        method: 'POST',
        body: formData,
      });
      
      setSelectedFile(null);
      setShowUpload(false);
      setSelectedFolder(null); // перезавантажити файли
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Помилка завантаження: ' + (err.message || 'невідома помилка'));
    } finally {
      setUploading(false);
    }
  };
  
  // Видалити файл
  const handleDeleteFile = async (id) => {
    if (!confirm('Ви впевнені, що хочете видалити цей файл?')) return;
    
    try {
      await api(`/media/${id}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Помилка видалення: ' + (err.message || 'невідома помилка'));
    }
  };
  
  // Створити папку
  const handleCreateFolder = async () => {
    const name = prompt('Назва папки:');
    if (!name?.trim()) return;
    
    try {
      const data = await api('/media/folders', {
        method: 'POST',
        body: { name: name.trim() },
      });
      setFolders([...folders, data]);
    } catch (err) {
      console.error('Create folder failed:', err);
      alert('Помилка створення папки: ' + (err.message || 'невідома помилка'));
    }
  };
  
  // Видалити папку
  const handleDeleteFolder = async (folder) => {
    if (folder._count.files > 0) {
      alert('Папка не порожня, спочатку видаліть файли');
      return;
    }
    if (folder.children?.length > 0) {
      alert('Папка містить підпапки, спочатку видаліть їх');
      return;
    }
    
    if (!confirm(`Ви впевнені, що хочете видалити папку "${folder.name}"?`)) return;
    
    try {
      await api(`/media/folders/${folder.id}`, { method: 'DELETE' });
      setFolders(folders.filter(f => f.id !== folder.id));
    } catch (err) {
      console.error('Delete folder failed:', err);
      alert('Помилка видалення папки: ' + (err.message || 'невідома помилка'));
    }
  };
  
  // Обрати папку
  const handleFolderSelect = (folderId) => {
    setSelectedFolder(folderId === 'root' ? null : folderId);
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Бібліотека файлів</h1>
        <div className="flex gap-3">
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Нова папка
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Upload size={18} />
            Завантажити файл
          </button>
        </div>
      </div>
      
      <div className="flex gap-6">
        {/* Сайдбар з папками */}
        <div className="w-64 flex-shrink-0">
          <div className="border border-slate-700 rounded-lg p-3 mb-4 bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <FolderOpen size={16} /> Папки
            </h2>
            <button
              onClick={() => handleFolderSelect('root')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedFolder === null ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
            >
              Корінь
            </button>
            {folders.map(folder => (
              <div key={folder.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleFolderSelect(folder.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm ${selectedFolder === folder.id ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
                >
                  {folder.name}
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder)}
                  className="text-red-400 hover:text-red-300"
                  title="Видалити папку"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Головна область */}
        <div className="flex-1">
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-800 mb-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">
              {selectedFolder ? (
                <span className="flex items-center gap-2">
                  <FolderOpen size={20} />
                  {folders.find(f => f.id === selectedFolder)?.name || 'Невідома папка'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FolderOpen size={20} />
                  Усі файли
                </span>
              )}
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {files.map(file => (
                <div key={file.id} className="relative group bg-slate-900 rounded-lg overflow-hidden">
                  <div className="aspect-square flex items-center justify-center bg-slate-800 p-4">
                    {file.type === 'SVG' ? (
                      <div dangerouslySetInnerHTML={{ __html: file.svgContent }} className="max-w-full max-h-full" />
                    ) : (
                      <img src={file.url} alt={file.name} className="max-w-full max-h-full object-contain" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm truncate text-slate-300">{file.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-400 uppercase">{file.type}</span>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Видалити файл"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {files.length === 0 && (
                <div className="col-span-4 text-center py-12 text-slate-500">
                  Немає файлів. Завантажте перший файл!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Модалка завантаження */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Завантажити файл</h2>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Виберіть файл</label>
                <input
                  type="file"
                  accept=".svg,.png,.jpg,.jpeg,.webp,.gif"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Папка</label>
                <select
                  value={selectedFolder || ''}
                  onChange={(e) => setSelectedFolder(e.target.value || null)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                >
                  <option value="">Корінь</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Тип іконки</label>
                <select
                  defaultValue="icon"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                >
                  <option value="icon">Ikon (іконка)</option>
                  <option value="header">Header (заголовок)</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpload(false)}
                className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
                disabled={uploading}
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  const fileInput = document.querySelector('input[type="file"]');
                  if (fileInput?.files?.[0]) {
                    handleFileSelect({ target: fileInput });
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700"
                disabled={uploading}
              >
                {uploading ? 'Завантаження...' : 'Завантажити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
