import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { Candidate } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const candidateId = `cand-${Date.now()}`;
    const newCandidate: Candidate = {
      id: candidateId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone || '',
      currentAffiliation: body.currentAffiliation || '',
      qualification: body.qualification || '',
      experienceYears: Number(body.experienceYears) || 0,
      resumeFileName: body.resumeFileName || `${body.fullName.replace(/\s+/g, '_')}_CV.pdf`,
      status: body.status || 'Applied'
    };

    request.candidates.push(newCandidate);

    const timestamp = new Date().toISOString();
    request.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      action: 'Candidate Added',
      performedBy: body.actorName || 'HR Team',
      role: 'HR Department',
      details: `Added candidate ${newCandidate.fullName} (${newCandidate.qualification})`,
      timestamp
    });

    await request.save();
    return NextResponse.json({ success: true, data: request.candidates });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to add candidate' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { candidateId, updates, actorName } = body;

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const candidateIndex = request.candidates.findIndex((c) => c.id === candidateId);
    if (candidateIndex === -1) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    // Merge updates
    const current = request.candidates[candidateIndex];
    if (updates.status) current.status = updates.status;
    if (updates.interviewDetails) {
      current.interviewDetails = {
        ...current.interviewDetails,
        ...updates.interviewDetails
      };
    }
    if (updates.joiningDetails) {
      current.joiningDetails = {
        ...current.joiningDetails,
        ...updates.joiningDetails
      };
    }

    request.candidates[candidateIndex] = current;

    const timestamp = new Date().toISOString();
    request.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      action: `Candidate Record Updated (${current.fullName})`,
      performedBy: actorName || 'HR Coordinator',
      role: 'HR Department',
      details: updates.status ? `Status changed to: ${updates.status}` : 'Candidate evaluation details updated',
      timestamp
    });

    await request.save();
    return NextResponse.json({ success: true, data: request.candidates });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update candidate' },
      { status: 500 }
    );
  }
}
