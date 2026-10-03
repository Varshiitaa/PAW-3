import React, { useState } from 'react';
import { Modal, Input, Button, Tabs } from '@streetpaw/ui';
import { Mail, Lock, User, Phone } from 'lucide-react';

export function AuthModal({ isOpen, onClose }) {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Logged in as ${email || 'Citizen Volunteer'}`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={authMode === 'login' ? 'Welcome Back' : 'Create Citizen Account'}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <Tabs
          tabs={[
            { id: 'login', label: 'Login' },
            { id: 'register', label: 'Register' },
          ]}
          activeTab={authMode}
          onChange={setAuthMode}
        />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {authMode === 'register' && (
          <Input
            label="Full Name"
            placeholder="e.g. Varshita Chauhan"
            icon={User}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <Input
          label="Email Address"
          type="email"
          placeholder="citizen@streetpaw.ai"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button variant="primary" type="submit" size="lg" style={{ marginTop: '8px' }}>
          {authMode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
    </Modal>
  );
}
