'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IHiringRequest } from '@/lib/types';
import { Header } from '@/components/Header';
import { DeanDepartmentModule } from '@/components/profiles/DeanDepartmentModule';
import { NewRequestModal } from '@/components/NewRequestModal';
import { RequestDetailModal } from '@/components/RequestDetailModal';

export default function DeanPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<IHiringRequest | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dean/requisitions');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load department requisitions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9] text-slate-800">
      <Header
        currentRole="Department / Dean"
        onRoleChange={() => {}}
        onOpenNewModal={() => router.push('/requisitions/new?role=dean')}
        onSeedData={() => {}}
        isSeeding={false}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <DeanDepartmentModule
          requests={requests}
          onSelectRequest={(req) => router.push(`/requisitions/${req.requestId}?role=dean`)}
          onOpenNewModal={() => router.push('/requisitions/new?role=dean')}
          onRefresh={fetchData}
        />
      </main>

      {/* Modals */}
      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchData}
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentRole="Department / Dean"
        onActionComplete={async () => {
          await fetchData();
          if (selectedRequest) {
            const res = await fetch(`/api/requests/${selectedRequest.requestId}`);
            const data = await res.json();
            if (data.success) setSelectedRequest(data.data);
          }
        }}
      />
    </div>
  );
}
