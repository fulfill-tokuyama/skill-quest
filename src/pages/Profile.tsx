import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface LinkItem {
  label: string;
  url: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [avatarData, setAvatarData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title || '');
        setBio(data.bio || '');
        setLinks(JSON.parse(data.links || '[]'));
        setAvatarData(data.avatar_data || '');
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bio, links, avatar_data: avatarData }),
      });
      if (res.ok) {
        setMessage('プロフィールを更新しました！');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`保存に失敗しました (${res.status})`);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to save profile', error);
      setMessage('プロフィールの更新に失敗しました');
      setTimeout(() => setMessage(''), 5000);
    }
  };

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
        const isPng = file.type === 'image/png';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resized = await resizeImage(file, 256);
      setAvatarData(resized);
    }
  };

  const addLink = () => {
    setLinks([...links, { label: '', url: '' }]);
  };

  const updateLink = (index: number, field: 'label' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  if (loading) return <div className="text-center mt-8">プロフィール読み込み中...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl text-yellow-400 mb-6">プロフィール編集</h1>
      
      {message && (
        <div className={`mb-4 p-2 text-center border ${message.includes('失敗') ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
          {message}
        </div>
      )}

      <div className="rpg-box flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 bg-gray-700 border-2 border-white shrink-0 overflow-hidden relative group">
            <img 
              src={avatarData || `https://api.dicebear.com/9.x/adventurer/png?seed=${user?.name}&hair=short01,short02,short03,short04,short05,short06,short07,short08&glassesProbability=0&size=64`}
              alt="Avatar"
              className="w-full h-full object-cover pixelated"
            />
            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <span className="text-xs text-white">変更</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <div className="flex-1">
            <label className="block text-xs mb-1 text-gray-400">名前</label>
            <div className="text-lg font-bold">{user?.name}</div>
            <div className="text-xs text-gray-500 mt-2">※アイコンをクリックして画像を変更できます</div>
          </div>
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-400">肩書き / 職業</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="rpg-input w-full"
            placeholder="例: フルスタックエンジニア"
          />
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-400">自己紹介 / 経歴</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="rpg-input w-full h-32"
            placeholder="あなたの冒険の記録を書きましょう..."
          />
        </div>

        <div>
          <label className="block text-xs mb-2 text-gray-400">リンク / ポートフォリオ</label>
          {links.map((link, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={link.label}
                onChange={e => updateLink(index, 'label', e.target.value)}
                className="rpg-input w-1/3"
                placeholder="ラベル (例: GitHub)"
              />
              <input
                type="url"
                value={link.url}
                onChange={e => updateLink(index, 'url', e.target.value)}
                className="rpg-input w-2/3"
                placeholder="URL"
              />
              <button type="button" onClick={() => removeLink(index)} className="text-red-500 px-2">X</button>
            </div>
          ))}
          <button type="button" onClick={addLink} className="text-xs text-yellow-400 hover:underline">
            + リンクを追加
          </button>
        </div>

        <div className="flex justify-end mt-4">
          <button type="button" onClick={handleSave} className="rpg-btn">変更を保存</button>
        </div>
      </div>
    </div>
  );
}
