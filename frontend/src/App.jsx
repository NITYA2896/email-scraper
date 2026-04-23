import React, { useState } from 'react';
import { Search, Loader2, Mail, LogIn, Layers, MessageSquare, ExternalLink } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

function App() {
  const [searchWord, setSearchWord] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = useGoogleLogin({
    onSuccess: async (response) => {
      setToken(response.access_token);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        setUser(userInfo.data);
      } catch (err) {
        console.error('Failed to get user info', err);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile',
  });

  const startScraping = async (e) => {
    if (e) e.preventDefault();
    if (!token) return;

    setIsScraping(true);
    setGroups([]);
    setError(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/gmail/scrape`, {
        token,
        searchWord
      });
      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsScraping(false);
    }
  };

  const [expandedGroups, setExpandedGroups] = useState([]);

  const toggleGroup = (index) => {
    setExpandedGroups(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.5rem' }}>
          Email-Scraper
        </h1>

      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto' }}>
        {!user ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <LogIn size={48} color="#3b82f6" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
            <h2 style={{ marginBottom: '1rem' }}>Welcome</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Please sign in with Google to organize your inbox.</p>
            <button onClick={() => login()} className="btn-primary" style={{ width: '100%' }}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={user.picture} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <span style={{ fontWeight: '600' }}>{user.name}</span>
              </div>
              <button onClick={() => { setUser(null); setToken(null); setGroups([]); }} style={{ fontSize: '0.875rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </div>

            <form onSubmit={startScraping} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Search word (optional)..."
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                className="input-field"
              />
              <button type="submit" disabled={isScraping} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isScraping ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                Scrape
              </button>
            </form>

            {error && (
              <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fee2e2', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {groups.map((group, idx) => (
                <div key={idx} className="card" style={{ overflow: 'hidden' }}>
                  <div
                    style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleGroup(idx)}
                  >
                    <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{group.context}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6', backgroundColor: '#eff6ff', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                      {group.count} emails {expandedGroups.includes(idx) ? '▴' : '▾'}
                    </span>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    {(expandedGroups.includes(idx) ? group.emails : group.emails.slice(0, 3)).map((email, eIdx) => (
                      <div key={eIdx} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{email.from}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(email.date).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{email.snippet}</p>
                      </div>
                    ))}
                    {group.count > 3 && !expandedGroups.includes(idx) && (
                      <p
                        style={{ fontSize: '0.75rem', color: '#3b82f6', textAlign: 'center', marginTop: '1rem', cursor: 'pointer', fontWeight: '600' }}
                        onClick={() => toggleGroup(idx)}
                      >
                        + {group.count - 3} more messages (Click to expand)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
