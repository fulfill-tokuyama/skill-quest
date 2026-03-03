import React, { useState, useEffect } from 'react';

interface Item {
  id?: string;
  type: 'weapon' | 'armor' | 'skill' | 'item';
  name: string;
  description: string;
  level: number;
  tags: string[];
  evidence_url: string;
  visibility: 'public' | 'private' | 'unlisted';
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  initialItem?: Item | null;
}

export default function ItemModal({ isOpen, onClose, onSave, initialItem }: ItemModalProps) {
  const [formData, setFormData] = useState<Item>({
    type: 'skill',
    name: '',
    description: '',
    level: 1,
    tags: [],
    evidence_url: '',
    visibility: 'private',
  });

  useEffect(() => {
    if (initialItem) {
      setFormData(initialItem);
    } else {
      setFormData({
        type: 'skill',
        name: '',
        description: '',
        level: 1,
        tags: [],
        evidence_url: '',
        visibility: 'private',
      });
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData({ ...formData, tags });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="rpg-box w-full max-w-lg relative animate-fade-in">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-500 hover:text-red-400">X</button>
        <h2 className="text-xl text-yellow-400 mb-4 text-center">
          {initialItem ? 'アイテムを編集' : '新しいアイテム'}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs mb-1 text-gray-400">種類</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
              className="rpg-input w-full"
            >
              <option value="weapon">武器 (攻めのスキル)</option>
              <option value="armor">防具 (守りのスキル)</option>
              <option value="skill">スキル (特殊能力)</option>
              <option value="item">アイテム (実績・資格)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-400">名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="rpg-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-400">説明</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="rpg-input w-full h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 text-gray-400">レベル (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.level}
                onChange={e => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="rpg-input w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-400">公開設定</label>
              <select
                value={formData.visibility}
                onChange={e => setFormData({ ...formData, visibility: e.target.value as any })}
                className="rpg-input w-full"
              >
                <option value="private">非公開</option>
                <option value="public">公開</option>
                <option value="unlisted">限定公開</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-400">タグ (カンマ区切り)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={handleTagChange}
              className="rpg-input w-full"
              placeholder="例: 営業, 開発, マネジメント"
            />
          </div>

          <div>
            <label className="block text-xs mb-1 text-gray-400">証明リンク (URL)</label>
            <input
              type="url"
              value={formData.evidence_url}
              onChange={e => setFormData({ ...formData, evidence_url: e.target.value })}
              className="rpg-input w-full"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="rpg-btn bg-gray-700 border-gray-500">キャンセル</button>
            <button type="submit" className="rpg-btn">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
