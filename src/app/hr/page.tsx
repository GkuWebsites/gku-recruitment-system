'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IHiringRequest } from '@/lib/types';
import { Header } from '@/components/Header';
import { HRDepartmentModule } from '@/components/profiles/HRDepartmentModule';
import { RequestDetailModal } from '@/components/RequestDetailModal';
import { NewRequestModal } from '@/components/NewRequestModal';

export default function HRPage() {
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IHiringRequest | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr');
      const data = await res.json();
      if (data.success) {
        setRequests([...(data.incoming || []), ...(data.sanctioned || [])]);
      }
    } catch (err) {
      console.error('Failed to load HR recruitment pipeline', err);
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
        currentRole="HR Department"
        onRoleChange={() => {}}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onSeedData={() => {}}
        isSeeding={false}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <HRDepartmentModule
          requests={requests}
          onSelectRequest={(req) => setSelectedRequest(req)}
          onRefresh={fetchData}
          onOpenNewModal={() => setIsNewModalOpen(true)}
        />
      </main>

      <NewRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={fetchData}
        userRole="HR Department"
        creatorName="Director of HR & Recruitment"
        creatorEmail="hr@gku.ac.in"
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentRole="HR Department"
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
