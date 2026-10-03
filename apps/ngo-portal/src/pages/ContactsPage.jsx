import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { PhoneCall, Plus, Check, Trash2, Edit3, ShieldCheck, ExternalLink, Globe, Mail } from 'lucide-react';

export function ContactsPage({ authToken, searchQuery }) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Contact form state
  const [name, setName] = useState('');
  const [type, setType] = useState('Helpline');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [services, setServices] = useState('24x7 Emergency Rescue, Vet Squad');

  useEffect(() => {
    fetchContacts();
  }, [searchQuery]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8000/api/contacts/?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyContact = async (contactId) => {
    if (!authToken) return;
    try {
      const res = await fetch(`http://localhost:8000/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ verified: true })
      });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!confirm("Delete contact record?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!authToken) return;
    try {
      const res = await fetch('http://localhost:8000/api/contacts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name,
          type,
          phone,
          email,
          city,
          services: services.split(',').map(s => s.trim()),
          verified: true
        })
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setName('');
        setPhone('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PhoneCall size={28} color="#f59e0b" /> Verified Helpline & Contact Directory
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Managed directory of animal welfare helplines, municipal ABC centers, and emergency vet hospitals
          </span>
        </div>

        <Button variant="emerald" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
          Add Verified Contact
        </Button>
      </div>

      {/* CONTACTS TABLE */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading Directory Contacts...</div>
      ) : (
        <Card variant="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px' }}>ORGANISATION / HELPLINE</th>
                <th style={{ padding: '14px' }}>TYPE</th>
                <th style={{ padding: '14px' }}>PHONE</th>
                <th style={{ padding: '14px' }}>LOCATION</th>
                <th style={{ padding: '14px' }}>VERIFIED</th>
                <th style={{ padding: '14px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px', fontWeight: 800, color: '#ffffff' }}>
                    {c.name}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant="brand">{c.type}</Badge>
                  </td>
                  <td style={{ padding: '14px', color: '#4ade80', fontWeight: 700 }}>
                    {c.phone}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    {c.city}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <Badge variant={c.verified ? 'emerald' : 'normal'}>
                      {c.verified ? '✓ VERIFIED' : 'UNVERIFIED'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!c.verified && (
                        <Button size="sm" variant="emerald" icon={Check} onClick={() => handleVerifyContact(c.id)}>
                          Verify
                        </Button>
                      )}
                      <Button size="sm" variant="critical" icon={Trash2} onClick={() => handleDeleteContact(c.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ADD CONTACT MODAL */}
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Verified Contact Record">
          <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Organisation / Helpline Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Type (e.g. Helpline, Vet Hospital, ABC Center)" value={type} onChange={(e) => setType(e.target.value)} required />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="City / Region" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Input label="Services (Comma separated)" value={services} onChange={(e) => setServices(e.target.value)} />
            <Button type="submit" variant="emerald" size="lg">Save Verified Contact</Button>
          </form>
        </Modal>
      )}

    </div>
  );
}
