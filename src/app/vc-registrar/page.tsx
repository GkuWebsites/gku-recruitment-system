'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IHiringRequest } from '@/lib/types';
import { Header } from '@/components/Header';
import { VCRegistrarModule } from '@/components/profiles/VCRegistrarModule';
import { RequestDetailModal } from '@/components/RequestDetailModal';

export default function VCRegistrarPage() {
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IHiringRequest | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests?role=VC%20%2F%20Registrar');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load VC sanction queue', err);
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
        currentRole="VC / Registrar"
        onRoleChange={() => {}}
        onOpenNewModal={() => {}}
        onSeedData={() => {}}
        isSeeding={false}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <VCRegistrarModule
          requests={requests}
          onSelectRequest={(req) => setSelectedRequest(req)}
          onRefresh={fetchData}
        />
      </main>

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentRole="VC / Registrar"
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
