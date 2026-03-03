import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function PublicView() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/public/${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Link not found or expired');
        return res.json();
      })
      .then(data => setData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center mt-8 text-white font-pixel">読み込み中...</div>;
  if (error) return <div className="text-center mt-8 text-red-500 font-pixel">{error}</div>;
  if (!data) return null;

  const { type, data: content } = data;

  return (
    <div className="min-h-screen bg-gray-900 p-4 font-pixel text-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl text-yellow-400 mb-2">SkillQuest</h1>
          <div className="text-xs text-gray-400">冒険者プロフィール</div>
        </div>

        {type === 'profile' && (
          <div className="flex flex-col gap-6">
            <div className="rpg-box flex flex-col md:flex-row gap-6 items-start">
              <div className="w-32 h-32 bg-gray-700 border-2 border-white shrink-0 overflow-hidden">
                <img 
                  src={content.profile.avatar_data || `https://api.dicebear.com/9.x/adventurer/png?seed=${content.user.name}&hair=short01,short02,short03,short04,short05,short06,short07,short08&glassesProbability=0&size=64`}
                  alt="Character Avatar"
                  className="w-full h-full object-cover pixelated"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-xl text-yellow-400 mb-2">{content.user.name}</h1>
                <div className="text-sm text-gray-300 mb-4">{content.profile.title}</div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap mb-4">{content.profile.bio}</p>
                
                <div className="flex flex-wrap gap-4">
                  {content.profile.links.map((link: any, i: number) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-xs">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="rpg-box">
              <h2 className="text-lg text-yellow-400 mb-4 border-b border-white/20 pb-2">公開スキル・アイテム</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.items.map((item: any) => (
                  <div key={item.id} className="bg-gray-800 p-3 border border-gray-700">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-xs text-yellow-400">LV {item.level}</span>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {item.type === 'weapon' ? '武器' :
                       item.type === 'armor' ? '防具' :
                       item.type === 'skill' ? 'スキル' : 'アイテム'}
                    </div>
                    <p className="text-xs text-gray-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {type === 'build' && (
          <div className="flex flex-col gap-6">
            <div className="rpg-box">
              <div className="text-xs text-gray-400 mb-1">作成者: {content.user.name}</div>
              <h1 className="text-xl text-yellow-400 mb-2">{content.build.name}</h1>
              <p className="text-sm text-gray-300">{content.build.purpose}</p>
            </div>

            <div className="rpg-box">
              <h2 className="text-lg text-yellow-400 mb-4 border-b border-white/20 pb-2">装備リスト</h2>
              <div className="space-y-2">
                {content.items.map((item: any) => (
                  <div key={item.id} className="flex items-center bg-gray-800 p-3 border border-gray-700">
                    <div className={`w-2 h-full mr-3 ${
                      item.type === 'weapon' ? 'bg-red-500' :
                      item.type === 'armor' ? 'bg-blue-500' :
                      item.type === 'skill' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-sm">{item.name}</span>
                        <span className="text-xs text-yellow-400">LV {item.level}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.type === 'weapon' ? '武器' :
                         item.type === 'armor' ? '防具' :
                         item.type === 'skill' ? 'スキル' : 'アイテム'}
                      </div>
                      {item.description && <div className="text-xs text-gray-500 mt-1">{item.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
