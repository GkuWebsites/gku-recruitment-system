import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

// API Category 2: Dean Academics
export async function GET() {
  try {
    await connectToDatabase();

    const all = await HiringRequestModel.find({}).sort({ createdAt: -1 }).lean();

    const pending = await HiringRequestModel.find({
      $or: [
        { currentStage: { $lte: 2 } },
        { status: 'Request Submitted (Department)' },
        { status: 'Under Review (Dean Academic)' },
        { status: 'Returned for Clarification' }
      ]
    }).sort({ createdAt: -1 }).lean();

    const cleared = await HiringRequestModel.find({
      $or: [
        { currentStage: { $gte: 3 } },
        { 'deanAcademicApproval.decision': { $in: ['Approved', 'Rejected'] } }
      ]
    }).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: all.length,
      data: all,
      pendingCount: pending.length,
      clearedCount: cleared.length,
      pending,
      cleared
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch academic reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { requestId, action, remarks, actorName } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: requestId.match(/^[0-9a-fA-F]{24}$/) ? requestId : null }, { requestId }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    const reviewer = actorName || 'Prof. Balwant Singh (Dean Academic)';

    if (action === 'approve') {
      request.status = 'Under Review (VC / Registrar)';
      request.currentStage = 3;
      request.deanAcademicApproval = {
        decision: 'Approved',
        remarks: remarks || 'Academic workload and student-to-faculty norms verified and cleared. Forwarded to VC / Registrar.',
        decidedBy: reviewer,
        decidedAt: timestamp
      };

      // If VC had previously queried for clarification, clear the clarification hold
      if (request.vcRegistrarApproval?.decision === 'Clarification') {
        request.vcRegistrarApproval = undefined;
      }

      if (remarks) {
        request.comments.push({
          id: `c-${Date.now()}`,
          authorName: reviewer,
          authorRole: 'Dean Academic',
          text: remarks,
          timestamp,
          category: 'Remark'
        });
      }

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Academic Clearance Approved — Dispatched to VC / Registrar',
        performedBy: reviewer,
        role: 'Dean Academic',
        details: remarks || 'Teaching load verified. Forwarded to VC / Registrar for administrative sanction.',
        timestamp
      });
    } else if (action === 'query') {
      request.status = 'Returned for Clarification';
      request.currentStage = 1;
      request.deanAcademicApproval = {
        decision: 'Clarification',
        remarks: remarks || 'Please furnish details of credit hours and semester teaching workload.',
        decidedBy: reviewer,
        decidedAt: timestamp
      };

      request.comments.push({
        id: `c-${Date.now()}`,
        authorName: reviewer,
        authorRole: 'Dean Academic',
        text: remarks || 'Clarification required regarding faculty workload distribution.',
        timestamp,
        category: 'Query'
      });

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Clarification Sought by Dean Academic',
        performedBy: reviewer,
        role: 'Dean Academic',
        details: remarks || 'Returned to Department Leadership for academic load clarification.',
        timestamp
      });
    } else if (action === 'reject') {
      request.status = 'Rejected';
      request.deanAcademicApproval = {
        decision: 'Rejected',
        remarks: remarks || 'Workforce requirement does not meet university council norms.',
        decidedBy: reviewer,
        decidedAt: timestamp
      };

      if (remarks) {
        request.comments.push({
          id: `c-${Date.now()}`,
          authorName: reviewer,
          authorRole: 'Dean Academic',
          text: remarks,
          timestamp,
          category: 'Remark'
        });
      }

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Academic Scrutiny Rejected',
        performedBy: reviewer,
        role: 'Dean Academic',
        details: remarks || 'Rejected at Academic Scrutiny.',
        timestamp
      });
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    await request.save();
    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process academic scrutiny' },
      { status: 500 }
    );
  }
}
