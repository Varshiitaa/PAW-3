import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Badge, Modal } from '@streetpaw/ui';
import { Search, Database, ShieldCheck, Heart, Plus, MapPin, Eye, Camera, CheckCircle2, Sparkles, Filter, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Syringe } from 'lucide-react';
import { PawBurstContainer } from '../components/PawBurst';
import { CreateDogStepperModal } from '../components/CreateDogStepperModal';
import { DogDetailModal } from '../components/DogDetailModal';
import './DogsPage.css';

export function DogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isRegisterStepperOpen, setIsRegisterStepperOpen] = useState(false);
  const [selectedDogCode, setSelectedDogCode] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchDogs = async () => {
    setIsLoading(true);
    try {
      let url = `http://localhost:8000/api/dogs?page=${page}&limit=12`;
      if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;
      if (selectedBreed !== 'all') url += `&breed=${encodeURIComponent(selectedBreed)}`;
      if (selectedStatus !== 'all') url += `&status=${encodeURIComponent(selectedStatus)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setDogs(data.items);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.total || 0);
      } else if (Array.isArray(data)) {
        setDogs(data);
        setTotalCount(data.length);
      }
    } catch (e) {
      console.error('Error fetching dogs registry:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, [page, searchTerm, selectedBreed, selectedStatus]);

  const handleOpenDetail = (dogCode) => {
    setSelectedDogCode(dogCode);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="dogs-page-layout">
      {/* Mint-Tinted Page Header */}
      <div className="dogs-page-header">
        <div>
          <Badge variant="emerald">GOVT & NGO CONNECTED DATABASE (V3-5)</Badge>
          <h2 className="dogs-page-title">Digital Animal Registry</h2>
          <p className="dogs-page-subtitle">
            Centralized health records, visual embeddings, and vaccination histories of re-identified stray animals across India.
          </p>
        </div>

        <PawBurstContainer type="paw">
          <Button
            variant="emerald"
            icon={Plus}
            size="lg"
            onClick={() => setIsRegisterStepperOpen(true)}
          >
            Register New Animal Tag ID
          </Button>
        </PawBurstContainer>
      </div>

      {/* Mint-Tinted Filter Bar Card */}
      <Card variant="glass" className="registry-filter-card">
        <div className="filter-row">
          <div className="search-box">
            <Input
              placeholder="Search by PAW code, location, or markings..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>

          <div className="dropdown-filters">
            <select
              className="mint-select"
              value={selectedBreed}
              onChange={(e) => { setSelectedBreed(e.target.value); setPage(1); }}
            >
              <option value="all">All Breed Types</option>
              <option value="Indian Pariah / Desi">Indian Pariah / Desi</option>
              <option value="Street Mongrel">Street Mongrel</option>
              <option value="Indie Pariah Mix">Indie Pariah Mix</option>
            </select>

            <select
              className="mint-select"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All Health Statuses</option>
              <option value="Healthy / Sterilized">Healthy / Sterilized</option>
              <option value="Under Medical Care">Under Medical Care</option>
              <option value="active_care">Active Care</option>
            </select>
          </div>

          <div className="total-records-count">
            Showing <strong>{dogs.length}</strong> of <strong>{totalCount}</strong> verified stray records
          </div>
        </div>
      </Card>

      {/* Dog Card Grid or Skeleton Loading */}
      {isLoading ? (
        <div className="dog-grid-layout">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <Card key={idx} variant="glass" className="skeleton-card">
              <div className="skeleton-img" />
              <div className="skeleton-text" />
              <div className="skeleton-text short" />
            </Card>
          ))}
        </div>
      ) : dogs.length === 0 ? (
        <Card variant="glass" className="empty-registry-state">
          <Database size={48} color="var(--primary-coral)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3>No Dog Records Found</h3>
          <p className="text-muted">No stray animals match the selected filters or search keyword.</p>
          <Button variant="emerald" icon={RefreshCw} className="mt-4" onClick={() => { setSearchTerm(''); setSelectedBreed('all'); setSelectedStatus('all'); }}>
            Reset Search Filters
          </Button>
        </Card>
      ) : (
        <div className="dog-grid-layout">
          {dogs.map((dog) => {
            let statusBadge = 'emerald';
            if (dog.status?.includes('Medical') || dog.health_status?.includes('Medical')) statusBadge = 'uncertain';
            if (dog.vaccinated) statusBadge = 'brand';

            return (
              <Card key={dog.id} variant="glow" className="dog-registry-card" onClick={() => handleOpenDetail(dog.public_code || dog.animal_id)}>
                <div className="card-photo-wrapper">
                  <img src={dog.image_url} alt={dog.name} className="card-dog-photo" />
                  <Badge variant={statusBadge} className="card-status-badge">
                    • {dog.status || dog.health_status || 'Healthy'}
                  </Badge>
                </div>

                <div className="card-body-content">
                  <div className="card-code-row">
                    <span className="paw-code-tag">{dog.public_code}</span>
                    <span className="card-date">{dog.date || 'Recently'}</span>
                  </div>

                  <h4 className="card-dog-name">{dog.name || `Stray ${dog.public_code}`}</h4>
                  <p className="card-dog-breed">{dog.breed}</p>

                  <div className="card-location-row">
                    <MapPin size={14} color="var(--primary-coral)" className="flex-shrink-0" />
                    <span className="location-text">{dog.location}</span>
                  </div>

                  <div className="card-tags-row">
                    <span className="mini-tag">Sex: {dog.sex || 'unknown'}</span>
                    <span className="mini-tag">Sterilised: {dog.sterilised || 'yes'}</span>
                    {dog.vaccinated && <span className="mini-tag vac font-bold">✓ Vaccinated</span>}
                  </div>

                  <Button variant="ghost" size="sm" icon={Eye} className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); handleOpenDetail(dog.public_code || dog.animal_id); }}>
                    View Full Profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="pagination-text">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <Button variant="secondary" size="sm" icon={ChevronRight} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* 4-Step Registration Stepper Modal */}
      <CreateDogStepperModal
        isOpen={isRegisterStepperOpen}
        onClose={() => setIsRegisterStepperOpen(false)}
        onSuccess={(createdCode) => {
          fetchDogs();
          handleOpenDetail(createdCode);
        }}
      />

      {/* Full Profile Detail Modal */}
      {isDetailModalOpen && (
        <DogDetailModal
          dogCode={selectedDogCode}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onRefresh={fetchDogs}
        />
      )}
    </div>
  );
}
