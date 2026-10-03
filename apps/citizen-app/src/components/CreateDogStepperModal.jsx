import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Card, Badge } from '@streetpaw/ui';
import { Camera, MapPin, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Upload, ShieldCheck, Heart } from 'lucide-react';
import { LocationPicker } from './LocationPicker';
import { PawBurstContainer } from './PawBurst';
import { useAuth } from '../context/AuthContext';

export function CreateDogStepperModal({ isOpen, onClose, onSuccess, prefilledData = null }) {
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [photoUrl, setPhotoUrl] = useState(prefilledData?.image_url || prefilledData?.image || '');
  const [name, setName] = useState('');
  const [breed, setBreed] = useState(prefilledData?.breed || 'Indian Pariah / Desi');
  const [sex, setSex] = useState('unknown');
  const [approxAge, setApproxAge] = useState('2 years');
  const [colourMarkings, setColourMarkings] = useState('Tan & White chest patch');
  const [sterilised, setSterilised] = useState('yes');
  const [earNotch, setEarNotch] = useState(true);
  const [status, setStatus] = useState('Healthy / Sterilized');

  // Location State
  const [locationData, setLocationData] = useState({
    lat: 12.9081,
    lng: 77.5653,
    address: 'DSU Campus Gate 2, Bengaluru',
    area: 'Kudlu Gate / Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka'
  });

  // Duplicate Check State
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (prefilledData) {
      if (prefilledData.image_url) setPhotoUrl(prefilledData.image_url);
      if (prefilledData.breed) setBreed(prefilledData.breed);
      if (prefilledData.status) setStatus(prefilledData.status);
    }
  }, [prefilledData]);

  // Step 4: Run Duplicate Check when entering Review step
  const handleProceedToStep4 = async () => {
    setCurrentStep(4);
    setIsCheckingDuplicate(true);
    setDuplicateResult(null);

    try {
      const res = await fetch('http://localhost:8000/api/dogs/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: photoUrl,
          breed,
          area: locationData.area || locationData.address,
          colour_markings: colourMarkings
        })
      });
      const data = await res.json();
      setDuplicateResult(data);
      if (data.duplicates_found && data.candidates.length > 0) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (e) {
      console.warn('Duplicate check warning:', e);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Option A: Link sighting to existing candidate
  const handleLinkToExistingCandidate = async (candidate) => {
    if (!token) {
      alert("Please login first to log a sighting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch(`http://localhost:8000/api/dogs/${candidate.public_code || candidate.animal_id}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address,
          area: locationData.area,
          city: locationData.city,
          state: locationData.state,
          note: 'Sighting linked via Duplicate Check Workflow'
        })
      });

      setShowCelebration(true);
      setTimeout(() => {
        onSuccess(candidate.public_code || candidate.animal_id);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option B: Register brand new Dog ID
  const handleRegisterNewDog = async () => {
    if (!token) {
      alert("Please login to register a dog in the central database.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:8000/api/dogs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          breed,
          sex,
          approx_age: approxAge,
          colour_markings: colourMarkings,
          sterilised,
          ear_notch: earNotch,
          status,
          health_status: status,
          image_url: photoUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop',
          location: locationData.address,
          location_lat: locationData.lat,
          location_lng: locationData.lng,
          area: locationData.area,
          city: locationData.city,
          state: locationData.state
        })
      });
      const data = await res.json();
      setShowCelebration(true);
      setTimeout(() => {
        onSuccess(data.public_code);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Stray Animal ID (4-Step Guided Flow)" maxWidth="640px">
      <div className="stepper-modal-container">
        {/* Step Indicator Bar */}
        <div className="stepper-indicator-bar">
          <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>1. Photo</div>
          <div className="step-line" />
          <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>2. Details</div>
          <div className="step-line" />
          <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>3. Location</div>
          <div className="step-line" />
          <div className={`step-dot ${currentStep >= 4 ? 'active' : ''}`}>4. Review</div>
        </div>

        {/* STEP 1: PHOTO */}
        {currentStep === 1 && (
          <div className="step-content">
            <h4 className="step-heading">Step 1: Upload or Confirm Photo</h4>
            <p className="step-sub">Provide a clear picture of the stray animal for Re-ID visual embedding.</p>

            <div className="photo-preview-box">
              {photoUrl ? (
                <img src={photoUrl} alt="Stray preview" className="stepper-photo-img" />
              ) : (
                <div className="empty-photo-dropzone">
                  <Camera size={40} color="var(--primary-coral)" />
                  <span>No photo attached yet</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="field-label">Photo Image URL</label>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image URL"
              />
            </div>

            <div className="stepper-actions">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="emerald" icon={ArrowRight} onClick={() => setCurrentStep(2)}>
                Next: Animal Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: DETAILS */}
        {currentStep === 2 && (
          <div className="step-content">
            <h4 className="step-heading">Step 2: Breed, Markings & Health Status</h4>
            <p className="step-sub">Fill physical characteristics and sterilization tags.</p>

            <div className="form-grid-2">
              <div>
                <label className="field-label">Pet / Stray Name (Optional)</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bruno or Desi Pack Leader" />
              </div>

              <div>
                <label className="field-label">Breed Classification</label>
                <select className="custom-select" value={breed} onChange={(e) => setBreed(e.target.value)}>
                  <option value="Indian Pariah / Desi">Indian Pariah / Desi</option>
                  <option value="Street Mongrel">Street Mongrel</option>
                  <option value="Indie Pariah Mix">Indie Pariah Mix</option>
                  <option value="Labrador Cross">Labrador Cross</option>
                  <option value="Indian Hound Mix">Indian Hound Mix</option>
                </select>
              </div>

              <div>
                <label className="field-label">Sex</label>
                <select className="custom-select" value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option value="male">Male ♂</option>
                  <option value="female">Female ♀</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="field-label">Approximate Age</label>
                <Input value={approxAge} onChange={(e) => setApproxAge(e.target.value)} placeholder="e.g. 2 years" />
              </div>

              <div className="col-span-2">
                <label className="field-label">Colour & Distinguishing Markings</label>
                <Input value={colourMarkings} onChange={(e) => setColourMarkings(e.target.value)} placeholder="e.g. Tan coat, white chest patch, black muzzle" />
              </div>

              <div>
                <label className="field-label">Sterilization Status (ABC Program)</label>
                <select className="custom-select" value={sterilised} onChange={(e) => setSterilised(e.target.value)}>
                  <option value="yes">Sterilized (Yes)</option>
                  <option value="no">Not Sterilized (No)</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="field-label">Ear Notch Present?</label>
                <select className="custom-select" value={earNotch ? 'yes' : 'no'} onChange={(e) => setEarNotch(e.target.value === 'yes')}>
                  <option value="yes">Yes (Right/Left Ear Notched)</option>
                  <option value="no">No Notch Visible</option>
                </select>
              </div>
            </div>

            <div className="stepper-actions mt-4">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => setCurrentStep(1)}>Back</Button>
              <Button variant="emerald" icon={ArrowRight} onClick={() => setCurrentStep(3)}>
                Next: Set Location
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: LOCATION */}
        {currentStep === 3 && (
          <div className="step-content">
            <h4 className="step-heading">Step 3: Sighting Location</h4>
            <p className="step-sub">Use GPS, search address, or drop a pin on the map.</p>

            <LocationPicker
              initialLocation={{
                lat: locationData.lat,
                lng: locationData.lng,
                address: locationData.address,
                area: locationData.area,
                city: locationData.city,
                state: locationData.state
              }}
              onSelectLocation={(loc) => {
                setLocationData(loc);
                handleProceedToStep4();
              }}
              onCancel={() => setCurrentStep(2)}
              confirmLabel="Next: Review & Duplicate Check"
            />
          </div>
        )}

        {/* STEP 4: REVIEW & DUPLICATE CHECK */}
        {currentStep === 4 && (
          <div className="step-content">
            <h4 className="step-heading">Step 4: Human-in-the-Loop Duplicate Verification</h4>

            {isCheckingDuplicate ? (
              <div className="checking-duplicate-spinner">
                <RefreshCw size={32} className="spin" color="var(--primary-coral)" />
                <p>Running Re-ID embeddings & similarity matching against central database...</p>
              </div>
            ) : showCelebration ? (
              <div className="celebration-box">
                <PawBurstContainer type="paw">
                  <Sparkles size={48} color="#10b981" />
                </PawBurstContainer>
                <h3 className="text-xl font-bold text-emerald-400 mt-2">Dog ID Created Successfully!</h3>
                <p className="text-muted text-sm">Registered into Central Digital Animal Registry & NGO Network.</p>
              </div>
            ) : (
              <div className="review-step-wrapper">
                {duplicateResult?.duplicates_found && selectedCandidate ? (
                  <Card variant="glow" className="duplicate-alert-card">
                    <div className="duplicate-card-header">
                      <AlertTriangle size={24} color="#f59e0b" />
                      <div>
                        <h4 className="font-bold text-amber-300">Possible Existing Match Found!</h4>
                        <p className="text-xs text-muted">This animal matches candidate {selectedCandidate.public_code} with {Math.round(selectedCandidate.similarity_score * 100)}% similarity score.</p>
                      </div>
                    </div>

                    <div className="candidate-preview-box">
                      <img src={selectedCandidate.image_url} alt="Candidate" className="candidate-thumb" />
                      <div>
                        <div className="font-bold text-coral-400">{selectedCandidate.public_code} ({selectedCandidate.animal_id})</div>
                        <div className="text-xs text-white">{selectedCandidate.name} • {selectedCandidate.breed}</div>
                        <div className="text-xs text-muted">📍 {selectedCandidate.location}</div>
                      </div>
                    </div>

                    <div className="duplicate-choice-buttons">
                      <Button
                        variant="primary"
                        icon={CheckCircle2}
                        loading={isSubmitting}
                        onClick={() => handleLinkToExistingCandidate(selectedCandidate)}
                      >
                        Yes, Same Dog! (Add Sighting to {selectedCandidate.public_code})
                      </Button>

                      <Button
                        variant="emerald"
                        loading={isSubmitting}
                        onClick={handleRegisterNewDog}
                      >
                        No, Register Brand New Dog ID
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card variant="glass" className="no-duplicate-card">
                    <Badge variant="emerald">✓ Zero Duplicates Detected</Badge>
                    <h4 className="font-bold text-lg text-white mt-2">Ready to Register Brand New Dog ID</h4>
                    <p className="text-muted text-sm mt-1">
                      {breed} • {locationData.address}
                    </p>

                    <Button
                      variant="emerald"
                      icon={Sparkles}
                      size="lg"
                      className="mt-4"
                      loading={isSubmitting}
                      onClick={handleRegisterNewDog}
                    >
                      Register into Database
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
