import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Profile {
  title: string;
  bio: string;
  links: { label: string; url: string }[];
  avatar_data?: string;
}

interface Item {
  level: number;
  type: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, itemsRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/items')
        ]);
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile({
            ...data,
            links: JSON.parse(data.links || '[]')
          });
        }
        
        if (itemsRes.ok) {
          const data = await itemsRes.json();
          setItems(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-8">ステータス読み込み中...</div>;

  // Calculate stats
  const totalLevel = items.reduce((acc, item) => acc + (item.level || 0), 0);
  const weaponCount = items.filter(i => i.type === 'weapon').length;
  const armorCount = items.filter(i => i.type === 'armor').length;
  const skillCount = items.filter(i => i.type === 'skill').length;

  const resizeImage = (file: File, maxSize: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const avatarData = await resizeImage(file, 256);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: profile?.title || '',
          bio: profile?.bio || '',
          links: profile?.links || [],
          avatar_data: avatarData,
        }),
      });
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, avatar_data: avatarData } : prev);
      }
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const handleCopyStatus = () => {
    const text = `
[冒険者: ${user?.name}]
職業: ${profile?.title || '駆け出し'}
レベル: ${Math.floor(totalLevel / 10) + 1} (経験値: ${totalLevel})

=== 能力値 ===
武器 (攻め): ${weaponCount}
防具 (守り): ${armorCount}
スキル (特殊能力): ${skillCount}
アイテム (実績): ${items.filter(i => i.type === 'item').length}

=== 自己紹介 ===
${profile?.bio || '自己紹介はまだありません。'}
    `.trim();
    navigator.clipboard.writeText(text);
    alert('ステータスをクリップボードにコピーしました！');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rpg-box flex flex-col md:flex-row gap-6 items-start relative">
        <button 
          onClick={handleCopyStatus}
          className="absolute top-2 right-2 text-xs text-gray-400 hover:text-white border border-gray-600 px-2 py-1 rounded"
        >
          ステータスをコピー
        </button>
        <div className="w-32 h-32 bg-gray-700 border-2 border-white shrink-0 overflow-hidden relative group">
          <img
            src={profile?.avatar_data || `https://api.dicebear.com/9.x/adventurer/png?seed=${user?.name}&hair=short01,short02,short03,short04,short05,short06,short07,short08&glassesProbability=0&size=64`}
            alt="Character Avatar"
            className="w-full h-full object-cover pixelated"
          />
          <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <span className="text-xs text-white">変更</span>
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
        <div className="flex-1 w-full">
          <h1 className="text-xl text-yellow-400 mb-2">{user?.name}</h1>
          <div className="text-sm text-gray-300 mb-4">{profile?.title || '駆け出しの冒険者'}</div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>レベル: {Math.floor(totalLevel / 10) + 1}</div>
            <div>経験値: {totalLevel}</div>
            <div>職業: {profile?.title ? profile.title.split(' ')[0] : 'フリーランス'}</div>
            <div>ギルド: {profile?.bio ? '所属' : 'なし'}</div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h3 className="text-yellow-400 mb-2">自己紹介</h3>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {profile?.bio || '自己紹介はまだ書かれていません。'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rpg-box">
          <h2 className="text-lg text-yellow-400 mb-4 border-b border-white/20 pb-2">能力値</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>武器 (攻めのスキル)</span>
              <span className="text-yellow-400">{weaponCount}</span>
            </div>
            <div className="flex justify-between">
              <span>防具 (守りのスキル)</span>
              <span className="text-yellow-400">{armorCount}</span>
            </div>
            <div className="flex justify-between">
              <span>スキル (特殊能力)</span>
              <span className="text-yellow-400">{skillCount}</span>
            </div>
            <div className="flex justify-between">
              <span>アイテム (実績・資格)</span>
              <span className="text-yellow-400">{items.filter(i => i.type === 'item').length}</span>
            </div>
          </div>
        </div>

        <div className="rpg-box">
          <h2 className="text-lg text-yellow-400 mb-4 border-b border-white/20 pb-2">コマンド</h2>
          <div className="flex flex-col gap-2">
            <Link to="/inventory" className="rpg-btn text-center">アイテムを整理する</Link>
            <Link to="/builds" className="rpg-btn text-center">装備セットを編集する</Link>
            <Link to="/profile" className="rpg-btn text-center">プロフィールを更新する</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
