import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

// API Category 1: Dean, Director & HODs
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (department && department !== 'All') {
      query.department = department;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const requests = await HiringRequestModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: requests.length, data: requests });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch department requisitions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Action 1: Department resubmitting clarification
    if (body.action === 'clarification_reply') {
      const { requestId, remarks, actorName } = body;
      const request = await HiringRequestModel.findOne({
        $or: [{ _id: requestId.match(/^[0-9a-fA-F]{24}$/) ? requestId : null }, { requestId }]
      });

      if (!request) {
        return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
      }

      request.status = 'Under Review (Dean Academic)';
      request.currentStage = 2;
      const timestamp = new Date().toISOString();

      request.comments.push({
        id: `c-${Date.now()}`,
        authorName: actorName || 'Department Dean / HOD',
        authorRole: 'Department / Dean',
        text: remarks || 'Clarification and workload justification submitted.',
        timestamp,
        category: 'Clarification'
      });

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Clarification Submitted by Department',
        performedBy: actorName || 'Department Dean / HOD',
        role: 'Department / Dean',
        details: remarks || 'Clarifications provided. Re-forwarded to Dean Academic for scrutiny.',
        timestamp
      });

      await request.save();
      return NextResponse.json({ success: true, data: request });
    }

    // Action 2: Raise new requisition by Dean / Director / HOD
    const count = await HiringRequestModel.countDocuments();
    const year = new Date().getFullYear();
    const requestId = `REQ-${year}-${String(count + 1).padStart(3, '0')}`;
    const timestamp = new Date().toISOString();

    const newRequest = new HiringRequestModel({
      requestId,
      department: body.department,
      postTitle: body.postTitle,
      postLevel: body.postLevel || 'Assistant Professor',
      employmentType: body.employmentType || 'Teaching',
      numberOfPositions: Number(body.numberOfPositions) || 1,
      justification: body.justification,
      requiredQualifications: body.requiredQualifications,
      experienceRequired: body.experienceRequired || '0 - 3 Years',
      tentativeBudget: body.tentativeBudget || 'As per UGC / University Norms',
      budgetAmountNumber: Number(body.budgetAmountNumber) || 0,
      urgency: body.urgency || 'Normal',
      creator: {
        name: body.creatorName || 'Dean / Director / HOD',
        role: 'Department / Dean',
        email: body.creatorEmail || 'department@gurukashiuniv.edu.in'
      },
      status: 'Request Submitted (Department)',
      currentStage: 1,
      promotionChannels: [],
      totalPromotionCost: 0,
      candidates: [],
      comments: body.initialComment
        ? [
            {
              id: `c-${Date.now()}`,
              authorName: body.creatorName || 'Dean / Director / HOD',
              authorRole: 'Department / Dean',
              text: body.initialComment,
              timestamp,
              category: 'Remark'
            }
          ]
        : [],
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          action: 'Requisition Raised by Department Leadership',
          performedBy: body.creatorName || 'Dean / Director / HOD',
          role: 'Department / Dean',
          details: `Requisition submitted for ${body.numberOfPositions} position(s) of ${body.postTitle} in ${body.department}. Dispatched to Dean Academic & HR.`,
          timestamp
        }
      ]
    });

    await newRequest.save();
    return NextResponse.json({ success: true, data: newRequest }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to submit requisition' },
      { status: 500 }
    );
  }
}
