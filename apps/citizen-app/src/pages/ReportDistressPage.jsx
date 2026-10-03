import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { AlertCircle, Camera, MapPin, Send, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, PhoneCall, RefreshCw, XCircle, History, Clock, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LocationPicker } from '../components/LocationPicker';
import { PawBurstContainer } from '../components/PawBurst';
import './ReportDistressPage.css';

export function ReportDistressPage({ activeTab = 'report' }) {
  const { user, token } = useAuth();
  const [currentTab, setCurrentTab] = useState('report'); // 'report' | 'my'
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [issueType, setIssueType] = useState('Injured Animal Trauma');
  const [urgency, setUrgency] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [aiSuggestedUrgency, setAiSuggestedUrgency] = useState(false);

  // Location State
  const [locationData, setLocationData] = useState({
    lat: 12.9081,
    lng: 77.5653,
    address: 'DSU Campus Gate 2, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  // My Complaints State
  const [myComplaints, setMyComplaints] = useState([]);
  const [isLoadingMy, setIsLoadingMy] = useState(false);

  // Guest Login Modal
  const [isGuestLoginOpen, setIsGuestLoginOpen] = useState(false);

  useEffect(() => {
    if (token && currentTab === 'my') {
      fetchMyComplaints();
    }
  }, [token, currentTab]);

  const fetchMyComplaints = async () => {
    setIsLoadingMy(true);
    try {
      const res = await fetch('http://localhost:8000/api/complaints/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMyComplaints(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMy(false);
    }
  };

  const handleSubmitDistress = async (e) => {
    e.preventDefault();
    if (!token) {
      setIsGuestLoginOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/complaints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          issue_type: issueType,
          urgency: urgency,
          description: description,
          photo: photoUrl || 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop',
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address,
          city: locationData.city,
          state: locationData.state
        })
      });

      const data = await res.json();
      setSubmittedResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelComplaint = async (publicId) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/api/complaints/${publicId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMyComplaints();
      } else {
        const err = await res.json();
        alert(err.detail || "Could not cancel complaint.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="report-distress-layout">
      {/* Page Header */}
      <div className="distress-page-header">
        <div>
          <Badge variant="critical">24/7 EMERGENCY RESCUE DISPATCH</Badge>
          <h2 className="distress-title">Emergency SOS Distress Reporter</h2>
          <p className="distress-subtitle">
            Report injured, sick, or trapped stray animals. Automatic GPS dispatches partner NGO rescue ambulances immediately.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher-row">
          <button
            type="button"
            className={`tab-btn ${currentTab === 'report' ? 'active' : ''}`}
            onClick={() => setCurrentTab('report')}
          >
            <AlertCircle size={16} /> Report Incident
          </button>

          <button
            type="button"
            className={`tab-btn ${currentTab === 'my' ? 'active' : ''}`}
            onClick={() => setCurrentTab('my')}
          >
            <History size={16} /> My Complaints ({myComplaints.length})
          </button>
        </div>
      </div>

      {currentTab === 'report' ? (
        submittedResult ? (
          /* CONFIRMATION SCREEN */
          <Card variant="glow" className="confirmation-card">
            <PawBurstContainer type="paw">
              <CheckCircle2 size={64} color="#10b981" className="mx-auto" />
            </PawBurstContainer>

            <h3 className="confirmation-title">Rescue Complaint #{submittedResult.public_id} Dispatched!</h3>
            <p className="confirmation-sub">
              Your distress signal was recorded in central database and dispatched to <strong>CUPA Rescue Team #4 & DSU Vet Cell</strong>.
            </p>

            {/* LIVE STATUS TRACKER STAGES */}
            <div className="status-tracker-box">
              <div className="tracker-stage active">
                <div className="stage-dot">1</div>
                <div className="stage-label">REPORTED</div>
              </div>
              <div className="tracker-line active" />
              <div className="tracker-stage">
                <div className="stage-dot">2</div>
                <div className="stage-label">ACKNOWLEDGED</div>
              </div>
              <div className="tracker-line" />
              <div className="tracker-stage">
                <div className="stage-dot">3</div>
                <div className="stage-label">TEAM DISPATCHED</div>
              </div>
              <div className="tracker-line" />
              <div className="tracker-stage">
                <div className="stage-dot">4</div>
                <div className="stage-label">RESOLVED</div>
              </div>
            </div>

            {/* Pawly Mascot Note */}
            <div className="pawly-mascot-note">
              <Sparkles size={24} color="#f59e0b" />
              <div>
                <h4 className="font-bold text-amber-300">Pawly Mascot Status Update</h4>
                <p className="text-xs text-white">"Don't worry! Help is on the way. An NGO ambulance vector team has been notified for {submittedResult.public_id}."</p>
              </div>
            </div>

            <div className="emergency-numbers-box mt-4">
              <div className="font-bold text-white text-sm mb-1">Direct Emergency Rescuer Contact</div>
              <a href="tel:+918022947300" className="tel-button font-bold text-emerald-400">
                <PhoneCall size={18} /> Call CUPA Rescue: +91 80 2294 7300
              </a>
            </div>

            <div className="flex gap-2 justify-center mt-6">
              <Button variant="emerald" onClick={() => setSubmittedResult(null)}>
                Report Another Incident
              </Button>
              <Button variant="secondary" onClick={() => setCurrentTab('my')}>
                View My Complaints Tracker
              </Button>
            </div>
          </Card>
        ) : (
          /* 3-STEP FORM STEPPER */
          <Card variant="glass" className="distress-form-card">
            {/* Step Bar */}
            <div className="distress-step-bar">
              <div className={`step-item ${currentStep >= 1 ? 'active' : ''}`}>1. Issue & Urgency</div>
              <div className="step-sep" />
              <div className={`step-item ${currentStep >= 2 ? 'active' : ''}`}>2. Incident Location</div>
              <div className="step-sep" />
              <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>3. Confirm & Dispatch</div>
            </div>

            <form onSubmit={handleSubmitDistress} className="distress-form-body">
              {/* STEP 1 */}
              {currentStep === 1 && (
                <div className="step-pane">
                  <h4 className="pane-title">Step 1: What is wrong & Urgency Assessment</h4>

                  <div>
                    <label className="field-label">Issue Category</label>
                    <select className="custom-select" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                      <option value="Hit & Run Leg Fracture">Hit & Run / Severe Injury</option>
                      <option value="Severe Skin Disease / Mange">Severe Skin Disease / Open Wound</option>
                      <option value="Trapped / Storm Drain Rescue">Trapped / Stranded</option>
                      <option value="Puppy Litter Distress">Abandoned Puppy Litter</option>
                      <option value="Rabies / Aggression Risk">Rabies / Bite Aggression Risk</option>
                      <option value="Other Stray Distress">Other Stray Distress</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Urgency Level</label>
                    <select className="custom-select" value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                      <option value="CRITICAL">🔴 CRITICAL — Hit & Run / Active Bleeding / Unconscious</option>
                      <option value="HIGH">🟠 HIGH — Severe Limping / Deep Wound / Infection</option>
                      <option value="MEDIUM">🟡 MEDIUM — Visible Scabies / Weakness / Dehydration</option>
                      <option value="LOW">🟢 LOW — Minor Scrape / Sterilization Need</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Photo of Injured Animal (Optional)</label>
                    <Input
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://... or attach image URL"
                    />
                  </div>

                  <div>
                    <label className="field-label">Description & Observations</label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Resting under tree near bus stop, limping heavily on rear right leg..."
                    />
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button type="button" variant="emerald" icon={ArrowRight} onClick={() => setCurrentStep(2)}>
                      Next: Incident Location
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {currentStep === 2 && (
                <div className="step-pane">
                  <h4 className="pane-title">Step 2: Pin Incident Location</h4>
                  <p className="text-xs text-muted mb-2">Use current GPS or search landmark to guide rescue ambulance.</p>

                  <LocationPicker
                    initialLocation={{
                      lat: locationData.lat,
                      lng: locationData.lng,
                      address: locationData.address,
                      city: locationData.city,
                      state: locationData.state
                    }}
                    onSelectLocation={(loc) => {
                      setLocationData(loc);
                      setCurrentStep(3);
                    }}
                    onCancel={() => setCurrentStep(1)}
                    confirmLabel="Next: Review & Confirm Dispatch"
                  />
                </div>
              )}

              {/* STEP 3 */}
              {currentStep === 3 && (
                <div className="step-pane">
                  <h4 className="pane-title">Step 3: Review & Broadcast SOS Signal</h4>

                  <div className="review-summary-card">
                    <div className="summary-item">
                      <span className="summary-label">Incident:</span>
                      <span className="summary-val font-bold text-coral-400">{issueType} ({urgency})</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Location:</span>
                      <span className="summary-val">📍 {locationData.address}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Reporter:</span>
                      <span className="summary-val">{user ? `${user.full_name || user.username} (${user.email})` : 'Guest'}</span>
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 mt-4">
                    <Button type="button" variant="secondary" icon={ArrowLeft} onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" variant="danger" icon={Send} loading={isSubmitting}>
                      DISPATCH EMERGENCY SOS NOW
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        )
      ) : (
        /* MY COMPLAINTS TRACKER */
        <div className="my-complaints-layout">
          {isLoadingMy ? (
            <div className="p-8 text-center text-muted">Loading your submitted rescue complaints...</div>
          ) : myComplaints.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-muted">
              You have not reported any distress incidents yet.
            </Card>
          ) : (
            <div className="complaints-list">
              {myComplaints.map((cmp) => {
                let statusVariant = 'critical';
                if (cmp.status === 'acknowledged') statusVariant = 'uncertain';
                if (cmp.status === 'in_progress') statusVariant = 'brand';
                if (cmp.status === 'resolved') statusVariant = 'emerald';

                const canCancel = ['reported', 'acknowledged'].includes(cmp.status);

                return (
                  <Card key={cmp.id} variant="glow" className="my-complaint-card">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-coral-400 text-lg">{cmp.public_id}</span>
                      <Badge variant={statusVariant}>{cmp.status.toUpperCase()}</Badge>
                    </div>

                    <h4 className="font-bold text-white text-md mt-1">{cmp.issue_type}</h4>
                    <p className="text-xs text-muted mt-1">📍 {cmp.address} • Reported: {cmp.created_at}</p>
                    {cmp.description && <p className="text-xs text-white mt-1">"{cmp.description}"</p>}

                    {/* Timeline Events */}
                    {cmp.events && cmp.events.length > 0 && (
                      <div className="events-timeline mt-3">
                        <div className="text-xs font-bold text-muted mb-1">Status Log Timeline:</div>
                        {cmp.events.map((ev) => (
                          <div key={ev.id} className="text-xs text-white flex items-center gap-2">
                            <Clock size={12} color="var(--primary-coral)" />
                            <span><strong>{ev.status.toUpperCase()}</strong>: {ev.note}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {canCancel && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleCancelComplaint(cmp.public_id)}
                        >
                          Cancel Complaint
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* GUEST LOGIN MODAL */}
      <Modal isOpen={isGuestLoginOpen} onClose={() => setIsGuestLoginOpen(false)} title="Login Required to Dispatch Emergency SOS">
        <div className="p-4 text-center">
          <p className="text-sm text-muted mb-4">
            Please log in or create a citizen account to submit emergency rescue complaints. Reporter details are verified to prevent false alarms.
          </p>
          <Button variant="emerald" onClick={() => { setIsGuestLoginOpen(false); window.location.href = '#/login'; }}>
            Go to Login / Sign Up
          </Button>
        </div>
      </Modal>
    </div>
  );
}
