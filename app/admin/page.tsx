'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">BOOPbase Admin</h1>
        
        <div className="bg-zinc-900 rounded-3xl p-8">
          <h2 className="text-2xl mb-6">All Users ({users.length})</h2>
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-700">
                    <th className="pb-4">Username</th>
                    <th className="pb-4">Name</th>
                    <th className="pb-4">Email</th>
                    <th className="pb-4">Links</th>
                    <th className="pb-4">Joined</th>
                    <th className="pb-4">Last Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any) => (
                    <tr key={user._id} className="border-b border-zinc-800">
                      <td className="py-4">@{user.username}</td>
                      <td className="py-4">{user.name}</td>
                      <td className="py-4 text-zinc-400">{user.email || '-'}</td>
                      <td className="py-4">{user.links?.length || 0}</td>
                      <td className="py-4 text-sm text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-sm text-zinc-400">
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}