'use client';

import { JUNK_ALERTS } from '@/lib/utils/JUNK_ALERTS';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AgentFormData {
  email: string;
  website: string;
  logoAvatar: string;
  agentAddress: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

export default function CreateAgentAccountPage() {
  const [formData, setFormData] = useState<AgentFormData>({
    email: '',
    website: '',
    logoAvatar: '',
    agentAddress: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.website) newErrors.website = 'Website is required';
    if (!formData.logoAvatar) newErrors.logoAvatar = 'LogoAvatar URL is required';
    if (!formData.agentAddress) newErrors.agentAddress = 'Ethereum address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    JUNK_ALERTS('Agent account created successfully');
    router.push('/');
  };

  return (
    <main className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-6 text-[#E5B94F]">Create an Agent Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required Fields */}
        {[
          { label: 'Email Address *', name: 'email' },
          { label: 'Website *', name: 'website' },
          { label: 'LogoAvatar URL *', name: 'logoAvatar' },
          { label: 'Ethereum Public Address *', name: 'agentAddress' },
          { label: 'First Name', name: 'firstName' },
          { label: 'Last Name', name: 'lastName' },
          { label: 'Phone Number', name: 'phone' },
          { label: 'Address', name: 'address' },
        ].map(({ label, name }) => (
          <div key={name} className="flex items-center gap-4">
            <label htmlFor={name} className="w-56 text-right">
              {label}
            </label>
            <div className="flex-1">
              <input
                type="text"
                id={name}
                name={name}
                value={(formData as any)[name] || ''}
                onChange={handleChange}
                className="w-full p-2 bg-[#1A1D2E] rounded border border-gray-600"
              />
              {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="bg-[#E5B94F] hover:bg-[#cfa52f] text-black font-semibold px-6 py-2 rounded"
          >
            Create Agent Account
          </button>
        </div>
      </form>
    </main>
  );
}
