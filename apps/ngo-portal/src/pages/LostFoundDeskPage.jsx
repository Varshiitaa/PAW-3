import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@streetpaw/ui';
import { HeartHandshake, Sparkles, Check, X, Phone, Lock, Search, MapPin, Calendar, Award } from 'lucide-react';

export function LostFoundDeskPage({ authToken, searchQuery }) {
  const [activeTab, setActiveTab] = useState('suggested'); // 'suggested' | 'lost' | 'found'
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [searchQuery]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch('http://localhost:8000/api/lost-found/', { headers });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Collect all suggested matches across posts for side-by-side view
  const allMatches = [];
  posts.forEach((post) => {
    if (post.matches && post.matches.length > 0) {
      post.matches.forEach((m) => {
        // avoid duplicate pairs by ordering post_id
        const pairKey = [post.id, m.matched_post_id].sort().join('-');
        if (!allMatches.some(x => x.pairKey === pairKey)) {
          allMatches.push({
            pairKey,
            matchId: m.match_id,
            score: m.score,
            status: m.status,
            postA: post,
            matchedPostId: m.matched_post_id,
            matchedKind: m.kind,
            matchedBreed: m.breed,
            matchedPhoto: m.photo,
            matchedAddress: m.address
          });
        }
      });
    }
  });

  const handleConfirmMatch = async (matchId) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:8000/api/lost-found/matches/${matchId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        alert("Match Confirmed! Phone contact unlocked for pet owner and finder.");
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectMatch = async (matchId) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:8000/api/lost-found/matches/${matchId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const lostPosts = posts.filter(p => p.kind === 'lost');
  const foundPosts = posts.filter(p => p.kind === 'found');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HeartHandshake size={28} color="#c084fc" /> Lost & Found Recovery Desk
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Monitor missing pets, stray sightings, and AI Re-ID pair similarity matches
        </span>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(30, 41, 59, 0.8)', padding: '6px', borderRadius: 'var(--radius-xl)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('suggested')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeTab === 'suggested' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'suggested' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={16} /> Suggested AI Matches ({allMatches.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lost')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeTab === 'lost' ? '#ef4444' : 'transparent',
            color: activeTab === 'lost' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Reported Lost ({lostPosts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('found')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeTab === 'found' ? '#10b981' : 'transparent',
            color: activeTab === 'found' ? '#fff' : 'var(--text-muted)',
            fontWeight: 800,
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          Reported Found ({foundPosts.length})
        </button>
      </div>

      {/* TAB 1: SUGGESTED MATCHES (SIDE-BY-SIDE PAIR COMPARISON) */}
      {activeTab === 'suggested' && (
        <div>
          {allMatches.length === 0 ? (
            <Card variant="glass" style={{ padding: '40px', textAlign: 'center' }}>
              <Sparkles size={40} color="#c084fc" style={{ marginBottom: '10px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Re-ID Pairs Currently Flagged</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                When new lost or found dogs are reported, potential matches will automatically appear here side-by-side.
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {allMatches.map((m) => (
                <Card key={m.matchId} variant="glass" style={{ borderColor: 'rgba(167, 139, 250, 0.4)', padding: '20px' }}>
                  
                  {/* Pair Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Badge variant="brand">⚡ RE-ID SIMILARITY MATCH</Badge>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#4ade80' }}>
                        {m.score}% Match Score
                      </span>
                    </div>

                    <Badge variant={m.status === 'confirmed' ? 'emerald' : 'normal'}>
                      STATUS: {m.status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Side by side comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    
                    {/* Left Card: Post A */}
                    <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <img src={m.postA.photo} alt="Post A" style={{ width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover' }} />
                        <div>
                          <Badge variant={m.postA.kind === 'lost' ? 'critical' : 'brand'}>
                            {m.postA.kind.toUpperCase()} POST #{m.postA.id}
                          </Badge>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{m.postA.dog_name}</h4>
                          <div style={{ fontSize: '0.8rem', color: '#c084fc' }}>{m.postA.breed}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📍 {m.postA.address}</div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '6px' }}>Owner: {m.postA.owner_name} ({m.postA.owner_phone})</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Card: Matched Candidate */}
                    <div style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <img src={m.matchedPhoto} alt="Matched Candidate" style={{ width: '90px', height: '90px', borderRadius: '10px', objectFit: 'cover' }} />
                        <div>
                          <Badge variant={m.matchedKind === 'lost' ? 'critical' : 'brand'}>
                            {m.matchedKind.toUpperCase()} POST #{m.matchedPostId}
                          </Badge>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>{m.matchedBreed}</h4>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📍 {m.matchedAddress}</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Actions Footer */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {m.status !== 'confirmed' && (
                      <>
                        <Button size="sm" variant="critical" icon={X} onClick={() => handleRejectMatch(m.matchId)}>
                          Reject Match
                        </Button>
                        <Button size="sm" variant="emerald" icon={Check} onClick={() => handleConfirmMatch(m.matchId)}>
                          Confirm Match & Unlock Contacts
                        </Button>
                      </>
                    )}
                  </div>

                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2 & 3: LOST / FOUND POST LISTS */}
      {(activeTab === 'lost' || activeTab === 'found') && (
        <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px' }}>ID</th>
                <th style={{ padding: '14px' }}>PHOTO</th>
                <th style={{ padding: '14px' }}>NAME / BREED</th>
                <th style={{ padding: '14px' }}>LOCATION</th>
                <th style={{ padding: '14px' }}>REPORTER</th>
                <th style={{ padding: '14px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'lost' ? lostPosts : foundPosts).map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4ade80' }}>
                    #{p.id}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <img src={p.photo} alt="Pet" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#fff' }}>
                    <div>{p.dog_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>{p.breed}</div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {p.address}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {p.owner_name} ({p.owner_phone})
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={p.status === 'reunited' ? 'emerald' : 'normal'}>
                      {p.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

    </div>
  );
}
