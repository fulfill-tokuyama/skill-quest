import React, { useState, useEffect } from 'react';

interface Item {
  id: string;
  name: string;
  type: string;
  level: number;
}

interface Build {
  id?: string;
  name: string;
  purpose: string;
  itemIds: string[];
}

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (build: Build) => void;
  initialBuild?: Build | null;
  availableItems: Item[];
}

export default function BuildModal({ isOpen, onClose, onSave, initialBuild, availableItems }: BuildModalProps) {
  const [formData, setFormData] = useState<Build>({
    name: '',
    purpose: '',
    itemIds: [],
  });

  useEffect(() => {
    if (initialBuild) {
      setFormData(initialBuild);
    } else {
      setFormData({
        name: '',
        purpose: '',
        itemIds: [],
      });
    }
  }, [initialBuild, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleItem = (itemId: string) => {
    setFormData(prev => {
      const newIds = prev.itemIds.includes(itemId)
        ? prev.itemIds.filter(id => id !== itemId)
        : [...prev.itemIds, itemId];
      return { ...prev, itemIds: newIds };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="rpg-box w-full max-w-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 hover:text-red-400">X</button>
        <h2 className="text-xl text-yellow-400 mb-4 text-center">
          {initialBuild ? 'セットを編集' : '新しいセット'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1 text-gray-400">セット名</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="rpg-input w-full"
              required
              placeholder="例: 営業用セット"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-400">用途・目的</label>
            <textarea
              value={formData.purpose}
              onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              className="rpg-input w-full h-20"
              placeholder="このセットはどんな時に使いますか？"
            />
          </div>

          <div>
            <label className="block text-xs mb-2 text-gray-400">装備を選択</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-700 p-2">
              {availableItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className={`p-2 border cursor-pointer flex justify-between items-center ${
                    formData.itemIds.includes(item.id) 
                      ? 'bg-blue-900 border-yellow-400' 
                      : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {item.type === 'weapon' ? '武器' :
                       item.type === 'armor' ? '防具' :
                       item.type === 'skill' ? 'スキル' : 'アイテム'} - LV {item.level}
                    </div>
                  </div>
                  {formData.itemIds.includes(item.id) && <span className="text-yellow-400">✓</span>}
                </div>
              ))}
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.itemIds.length} 個選択中
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="rpg-btn bg-gray-700 border-gray-500">キャンセル</button>
            <button type="submit" className="rpg-btn">セットを保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
