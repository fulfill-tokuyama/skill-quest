import React, { useState, useEffect } from 'react';
import ItemModal from '../components/ItemModal';
import { Trash2, Edit, ExternalLink } from 'lucide-react';

interface Item {
  id: string;
  type: 'weapon' | 'armor' | 'skill' | 'item';
  name: string;
  description: string;
  level: number;
  tags: string[];
  evidence_url: string;
  visibility: 'public' | 'private' | 'unlisted';
}

export default function Inventory() {
  const [items, setItems] = useState<Item[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemData: any) => {
    try {
      const url = editingItem ? `/api/items/${editingItem.id}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (res.ok) {
        fetchItems();
        setIsModalOpen(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Failed to save item', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete item', error);
    }
  };

  const filteredItems = filterType === 'all' ? items : items.filter(i => i.type === filterType);

  if (loading) return <div className="text-center mt-8">アイテム一覧を読み込み中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-yellow-400">アイテム一覧</h1>
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="rpg-btn bg-green-700 hover:bg-green-600"
        >
          + アイテムを追加
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'すべて' },
          { id: 'weapon', label: '武器' },
          { id: 'armor', label: '防具' },
          { id: 'skill', label: 'スキル' },
          { id: 'item', label: 'アイテム' }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setFilterType(type.id)}
            className={`px-3 py-1 border-2 border-white text-xs uppercase ${filterType === type.id ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="rpg-box relative group hover:border-yellow-400 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs px-1 border border-white/50 ${
                item.type === 'weapon' ? 'text-red-400' :
                item.type === 'armor' ? 'text-blue-400' :
                item.type === 'skill' ? 'text-green-400' : 'text-purple-400'
              }`}>
                {item.type === 'weapon' ? '武器' :
                 item.type === 'armor' ? '防具' :
                 item.type === 'skill' ? 'スキル' : 'アイテム'}
              </span>
              <span className="text-yellow-400 text-xs">LV {item.level}</span>
            </div>
            
            <h3 className="font-bold mb-1 truncate">{item.name}</h3>
            <p className="text-xs text-gray-400 mb-3 h-12 overflow-hidden line-clamp-2">
              {item.description || '説明なし'}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.map(tag => (
                <span key={tag} className="text-[10px] bg-gray-700 px-1 rounded text-gray-300">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-2 border-t border-white/10 pt-2">
              {item.evidence_url && (
                <a href={item.evidence_url} target="_blank" rel="noreferrer" className="p-1 hover:text-blue-400">
                  <ExternalLink size={14} />
                </a>
              )}
              <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1 hover:text-yellow-400">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded">
            アイテムが見つかりません。冒険の記録を追加しましょう！
          </div>
        )}
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialItem={editingItem}
      />
    </div>
  );
}
