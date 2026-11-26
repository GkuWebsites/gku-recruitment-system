import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

// API Category 1: Department Deans & Directors
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
        authorName: actorName || 'Department Dean',
        authorRole: 'Department / Dean',
        text: remarks || 'Clarification and workload justification submitted.',
        timestamp,
        category: 'Clarification'
      });

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Clarification Submitted by Department',
        performedBy: actorName || 'Department Dean',
        role: 'Department / Dean',
        details: remarks || 'Clarifications provided. Re-forwarded to Dean Academic for scrutiny.',
        timestamp
      });

      await request.save();
      return NextResponse.json({ success: true, data: request });
    }

    // Action 2: Raise new requisition by Department Dean / Director
    // Auto-generate request ID following GKUJD0001 pattern
    const existingGku = await HiringRequestModel.find({ requestId: /^GKUJD\d+/i }).select('requestId').lean();
    let maxNum = 0;
    for (const doc of existingGku) {
      const match = doc.requestId.match(/^GKUJD(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    let nextNum = maxNum > 0 ? maxNum + 1 : 1;
    let requestId = `GKUJD${String(nextNum).padStart(4, '0')}`;
    while (await HiringRequestModel.exists({ requestId })) {
      nextNum++;
      requestId = `GKUJD${String(nextNum).padStart(4, '0')}`;
    }
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
      tentativeBudget: body.tentativeBudget || 'To be decided by HR',
      budgetAmountNumber: Number(body.budgetAmountNumber) || 0,
      urgency: body.urgency || 'Normal',
      creator: {
        name: body.creatorName || 'Department Dean / Director',
        role: 'Department / Dean',
        email: body.creatorEmail || 'department@gku.ac.in'
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
              authorName: body.creatorName || 'Department Dean / Director',
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
          performedBy: body.creatorName || 'Department Dean / Director',
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
