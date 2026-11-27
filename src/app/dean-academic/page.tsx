'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IHiringRequest } from '@/lib/types';
import { Header } from '@/components/Header';
import { DeanAcademicModule } from '@/components/profiles/DeanAcademicModule';
import { RequestDetailModal } from '@/components/RequestDetailModal';

export default function DeanAcademicPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<IHiringRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<IHiringRequest | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load academic review queue', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen flex flex-col bg-[#D3D3D3] text-slate-800">
      <Header
        currentRole="Dean Academic"
        onRoleChange={() => { }}
        onOpenNewModal={() => { }}
        onSeedData={() => { }}
        isSeeding={false}
      />

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
        <DeanAcademicModule
          requests={requests}
          onSelectRequest={(req) => router.push(`/requisitions/${req.requestId}?role=dean-academic`)}
          onRefresh={fetchData}
        />
      </main>

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        currentRole="Dean Academic"
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
