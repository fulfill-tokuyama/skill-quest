import React, { useState, useEffect } from 'react';
import BuildModal from '../components/BuildModal';
import { Trash2, Edit, Share2, Copy } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  type: string;
  level: number;
}

interface Build {
  id: string;
  name: string;
  purpose: string;
  items: Item[]; // items populated from backend
}

export default function Builds() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBuild, setEditingBuild] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [buildsRes, itemsRes] = await Promise.all([
        fetch('/api/builds'),
        fetch('/api/items')
      ]);
      
      if (buildsRes.ok) {
        const data = await buildsRes.json();
        setBuilds(data);
      }
      
      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (buildData: any) => {
    try {
      const url = editingBuild ? `/api/builds/${editingBuild.id}` : '/api/builds';
      const method = editingBuild ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildData),
      });

      if (res.ok) {
        fetchData();
        setIsModalOpen(false);
        setEditingBuild(null);
      }
    } catch (error) {
      console.error('Failed to save build', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this build?')) return;
    try {
      const res = await fetch(`/api/builds/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBuilds(builds.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete build', error);
    }
  };

  const handleShare = async (buildId: string) => {
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'build', targetId: buildId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/share/${data.token}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share build', error);
    }
  };

  const handleCopyText = (build: Build) => {
    const text = `
[装備セット: ${build.name}]
${build.purpose}

=== 装備一覧 ===
${build.items.map(i => `- [${i.type === 'weapon' ? '武器' : i.type === 'armor' ? '防具' : i.type === 'skill' ? 'スキル' : 'アイテム'}] ${i.name} (LV ${i.level})`).join('\n')}
    `.trim();
    navigator.clipboard.writeText(text);
    alert('装備セットの内容をコピーしました！');
  };

  if (loading) return <div className="text-center mt-8">装備セットを読み込み中...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl text-yellow-400">装備セット (ビルド)</h1>
        <button 
          onClick={() => { setEditingBuild(null); setIsModalOpen(true); }}
          className="rpg-btn bg-green-700 hover:bg-green-600"
        >
          + 新しいセットを作成
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {builds.map(build => (
          <div key={build.id} className="rpg-box relative">
            <div className="flex justify-between items-start border-b border-white/20 pb-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-yellow-400">{build.name}</h3>
                <p className="text-xs text-gray-400">{build.purpose}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopyText(build)} className="p-1 hover:text-green-400" title="テキストをコピー">
                  <Copy size={16} />
                </button>
                <button onClick={() => handleShare(build.id)} className="p-1 hover:text-blue-400" title="共有リンク">
                  <Share2 size={16} />
                </button>
                <button onClick={() => { 
                  setEditingBuild({ ...build, itemIds: build.items.map(i => i.id) }); 
                  setIsModalOpen(true); 
                }} className="p-1 hover:text-yellow-400">
                  <Edit size={16} />
                </button>
                <button onClick={() => handleDelete(build.id)} className="p-1 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {build.items.map(item => (
                <div key={item.id} className="bg-gray-800 p-2 border border-gray-700 flex justify-between items-center">
                  <span className="text-xs">{item.name}</span>
                  <span className={`text-[10px] px-1 rounded ${
                    item.type === 'weapon' ? 'bg-red-900 text-red-200' :
                    item.type === 'armor' ? 'bg-blue-900 text-blue-200' :
                    item.type === 'skill' ? 'bg-green-900 text-green-200' : 'bg-purple-900 text-purple-200'
                  }`}>
                    LV {item.level}
                  </span>
                </div>
              ))}
              {build.items.length === 0 && (
                <div className="text-xs text-gray-500 italic p-2">装備なし</div>
              )}
            </div>
          </div>
        ))}

        {builds.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded">
            装備セットがありません。目的に合わせてセットを作りましょう！
          </div>
        )}
      </div>

      <BuildModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialBuild={editingBuild}
        availableItems={items}
      />
    </div>
  );
}
