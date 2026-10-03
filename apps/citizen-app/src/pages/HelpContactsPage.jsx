import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { PhoneCall, ShieldCheck, Heart, Building2, Scale, Search, Copy, Check, ExternalLink, MessageCircle, AlertCircle, Plus, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './HelpContactsPage.css';

export function HelpContactsPage() {
  const { user, token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Suggest Contact Modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    type: 'Helpline',
    phone: '',
    email: '',
    website: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    services: 'Emergency Rescue',
    hours: '24/7 Emergency'
  });
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [selectedService, selectedCity, searchQuery]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      let url = 'http://localhost:8000/api/contacts?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (selectedService !== 'all') url += `service=${encodeURIComponent(selectedService)}&`;
      if (selectedCity !== 'all') url += `city=${encodeURIComponent(selectedCity)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
      }
    } catch (e) {
      console.error('Error fetching contacts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDetails = (id, textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSuggestSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert('Please login to suggest a contact.');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/contacts/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...suggestForm,
          services: suggestForm.services.split(',').map(s => s.trim())
        })
      });
      if (res.ok) {
        setSuggestSuccess(true);
        setTimeout(() => {
          setSuggestSuccess(false);
          setIsSuggestModalOpen(false);
          fetchContacts();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Top 24/7 Verified Emergency Helplines
  const emergencyContacts = contacts.filter(c => c.is_24x7);

  return (
    <div className="help-contacts-layout">
      {/* Rose-tinted Page Header */}
      <div className="help-page-header">
        <div>
          <Badge variant="brand" className="rose-badge">MANAGED ANIMAL DIRECTORY (V3-6)</Badge>
          <h2 className="help-title">Emergency Helplines & NGO Directory</h2>
          <p className="help-subtitle">
            National animal helplines, veterinary trauma hospitals, municipal stray dog cells, and legal protection contacts across India.
          </p>
        </div>

        <Button variant="emerald" icon={Plus} onClick={() => setIsSuggestModalOpen(true)}>
          Suggest a Contact
        </Button>
      </div>

      {/* TOP EMERGENCY 24/7 BANNER */}
      <div className="emergency-contacts-banner">
        <div className="banner-top-title">
          <AlertCircle size={22} color="#f43f5e" />
          <span>24/7 Emergency Ambulance & Rescue Dispatch</span>
        </div>

        <div className="emergency-buttons-grid">
          {emergencyContacts.slice(0, 3).map((ec) => (
            <div key={ec.id} className="emergency-quick-card">
              <div>
                <div className="font-bold text-white text-sm">{ec.name}</div>
                <div className="text-xs text-rose-300">📍 {ec.city} • 24/7 Helpline</div>
              </div>

              <div className="flex gap-2 mt-2">
                <a href={`tel:${ec.phone}`} className="tap-call-btn">
                  <PhoneCall size={16} /> Call {ec.phone}
                </a>

                {ec.group_link ? (
                  <a href={ec.group_link} target="_blank" rel="noreferrer" className="tap-wa-btn">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                ) : (
                  <a href={`https://wa.me/${ec.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="tap-wa-btn">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FILTER CHIPS & SEARCH BAR */}
      <Card variant="glass" className="rose-filter-card">
        <div className="filter-chips-row">
          {['all', 'Emergency Rescue', 'Veterinary Ambulance', 'Cruelty Reporting', 'ABC Sterilization'].map((srv) => (
            <button
              key={srv}
              type="button"
              className={`chip-btn ${selectedService === srv ? 'active' : ''}`}
              onClick={() => setSelectedService(srv)}
            >
              {srv === 'all' ? 'All Services' : srv}
            </button>
          ))}
        </div>

        <div className="search-city-row">
          <div className="flex-1">
            <Input
              placeholder="Search organisation name, phone, or area..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="rose-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">All Cities</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Chennai">Chennai</option>
            <option value="New Delhi">New Delhi</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>
      </Card>

      {/* MAIN CONTACTS CARD GRID */}
      {isLoading ? (
        <div className="text-center p-8 text-muted">Loading helpline directory from central database...</div>
      ) : contacts.length === 0 ? (
        <Card variant="glass" className="p-8 text-center text-muted">
          No helpline entries match the selected filters.
        </Card>
      ) : (
        <div className="contacts-cards-grid">
          {contacts.map((c) => {
            const isCopied = copiedId === c.id;
            const fullCopyText = `${c.name}\nPhone: ${c.phone}\nEmail: ${c.email || 'N/A'}\nCity: ${c.city}`;

            return (
              <Card key={c.id} variant="glow" className="contact-directory-card">
                <div className="card-header-flex">
                  <Badge variant={c.verified ? "emerald" : "uncertain"}>
                    {c.verified ? "✓ Verified Helpline" : "Unverified"}
                  </Badge>

                  {c.is_24x7 && <Badge variant="critical">24/7 Emergency</Badge>}
                </div>

                <h3 className="contact-org-name">{c.name}</h3>
                <p className="contact-city-tag">📍 {c.city}, {c.state} • {c.type}</p>

                <div className="contact-services-pills">
                  {(c.services || []).map((s, idx) => (
                    <span key={idx} className="service-pill">{s}</span>
                  ))}
                </div>

                {c.hours && <div className="text-xs text-muted font-mono mt-1">⏰ {c.hours}</div>}

                <div className="contact-action-row">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="action-link-btn call">
                      <PhoneCall size={16} /> Call
                    </a>
                  )}

                  {c.phone && (
                    <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="action-link-btn wa">
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}

                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" className="action-link-btn web">
                      <ExternalLink size={16} /> Website
                    </a>
                  )}

                  <button
                    type="button"
                    className="action-link-btn copy"
                    onClick={() => handleCopyDetails(c.id, fullCopyText)}
                  >
                    {isCopied ? <Check sizeShift={16} color="#10b981" /> : <Copy size={16} />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* STATIC ANIMAL RIGHTS LEGAL GUIDE SECTION */}
      <Card variant="glass" className="legal-guide-card">
        <div className="legal-card-header">
          <Scale size={24} color="#f43f5e" />
          <h3 className="font-bold text-white text-lg">Citizen Guide: Stray Animal Rights & Protection Laws in India</h3>
        </div>

        <div className="legal-points-grid">
          <div className="legal-point">
            <h4 className="text-rose-400 font-bold text-sm">Prevention of Cruelty to Animals (PCA) Act, 1960</h4>
            <p className="text-xs text-muted mt-1">Section 11(1) makes beating, kicking, starving, or abandoning any stray animal a punishable criminal offense.</p>
          </div>

          <div className="legal-point">
            <h4 className="text-rose-400 font-bold text-sm">Animal Birth Control (ABC) Rules, 2023</h4>
            <p className="text-xs text-muted mt-1">Municipalities cannot relocate stray dogs. Dogs must be sterilised, vaccinated, and released back into the exact same locality.</p>
          </div>

          <div className="legal-point">
            <h4 className="text-rose-400 font-bold text-sm">High Court Feeding Protection Guidelines</h4>
            <p className="text-xs text-muted mt-1">Citizens have a legal right to feed street dogs. Intimidation or harassment of animal feeders is strictly illegal.</p>
          </div>
        </div>
      </Card>

      {/* SUGGEST A CONTACT MODAL */}
      <Modal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} title="Suggest a New Rescue Helpline">
        {suggestSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={48} color="#10b981" className="mx-auto mb-2" />
            <h4 className="font-bold text-white text-lg">Contact Suggested!</h4>
            <p className="text-xs text-muted">Queued for admin verification. Thank you for contributing!</p>
          </div>
        ) : (
          <form onSubmit={handleSuggestSubmit} className="p-4 flex flex-col gap-4">
            <div>
              <label className="field-label">Organisation / Helpline Name</label>
              <Input
                value={suggestForm.name}
                onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                placeholder="e.g. Local SPCA Shelter"
                required
              />
            </div>

            <div className="grid-2-col">
              <div>
                <label className="field-label">Phone Number</label>
                <Input
                  value={suggestForm.phone}
                  onChange={(e) => setSuggestForm({ ...suggestForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <div>
                <label className="field-label">City</label>
                <Input
                  value={suggestForm.city}
                  onChange={(e) => setSuggestForm({ ...suggestForm, city: e.target.value })}
                  placeholder="e.g. Bengaluru"
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Services Provided (comma separated)</label>
              <Input
                value={suggestForm.services}
                onChange={(e) => setSuggestForm({ ...suggestForm, services: e.target.value })}
                placeholder="e.g. Emergency Ambulance, Trauma Care, ABC Drive"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="ghost" onClick={() => setIsSuggestModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="emerald" icon={CheckCircle2} loading={isSubmitting}>Submit Suggestion</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
