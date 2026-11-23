import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

// API Category 3: VC / Registrar
export async function GET() {
  try {
    await connectToDatabase();

    // STRICT GOVERNANCE: Only items cleared by Dean Academic!
    const pendingQuery: Record<string, any> = {
      $and: [
        { 'deanAcademicApproval.decision': 'Approved' },
        { status: { $in: ['Under Review (VC / Registrar)', 'Approved by Dean Academic'] } },
        { 'vcRegistrarApproval.decision': { $exists: false } }
      ]
    };

    const sanctionedQuery: Record<string, any> = {
      $and: [
        { 'deanAcademicApproval.decision': 'Approved' },
        {
          $or: [
            {
              status: {
                $in: [
                  'Approved by VC / Registrar',
                  'In Process (HR - Recruitment)',
                  'Interview & Selection Completed',
                  'Joined & Request Closed'
                ]
              }
            },
            { 'vcRegistrarApproval.decision': { $in: ['Approved', 'Rejected', 'Clarification'] } }
          ]
        }
      ]
    };

    const pendingSanction = await HiringRequestModel.find(pendingQuery).sort({ createdAt: -1 }).lean();
    const sanctionedHistory = await HiringRequestModel.find(sanctionedQuery).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      pendingCount: pendingSanction.length,
      sanctionedCount: sanctionedHistory.length,
      pendingSanction,
      sanctionedHistory
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch sanction records' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { requestId, action, remarks, actorName, actorRole } = body;

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

    // Enforce Dean Academic clearance before VC sanction
    if (!request.deanAcademicApproval || request.deanAcademicApproval.decision !== 'Approved') {
      return NextResponse.json(
        { success: false, error: 'Requisition cannot be sanctioned by VC / Registrar until approved by Dean Academic.' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();
    const sanctioner = actorName || 'Prof. (Dr.) Gurinder Singh (VC Office)';

    if (action === 'sanction') {
      request.status = 'In Process (HR - Recruitment)';
      request.currentStage = 4;
      request.vcRegistrarApproval = {
        decision: 'Approved',
        remarks: remarks || 'Administrative and financial sanction accorded as per budget head. Released to HR Recruitment Cell.',
        decidedBy: sanctioner,
        decidedAt: timestamp
      };

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `${actorRole || 'Administrative'} Sanction Granted — Released to HR Recruitment Cell`,
        performedBy: sanctioner,
        role: 'VC / Registrar',
        details: remarks || 'Sanction accorded. Requisition handed over to HR Recruitment Cell for advertising and candidate intake.',
        timestamp
      });
    } else if (action === 'query') {
      const isBoth = Boolean(body.sendToBoth || body.targetAudience === 'Both');
      const targetLabel = isBoth ? 'Both Dean Academic & Department Dean' : 'Dean Academic Only';

      request.status = 'Returned for Clarification';
      request.currentStage = isBoth ? 1 : 2;
      request.vcRegistrarApproval = {
        decision: 'Clarification',
        remarks: remarks || 'Clarification required regarding post scale and budget authorization.',
        decidedBy: sanctioner,
        decidedAt: timestamp
      };

      request.comments.push({
        id: `c-${Date.now()}`,
        authorName: sanctioner,
        authorRole: 'VC / Registrar',
        text: `[Clarification Dispatched to: ${targetLabel}] ${remarks || 'VC Office clarification query.'}`,
        timestamp,
        category: 'Query'
      });

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Clarification Sought by VC / Registrar (${targetLabel})`,
        performedBy: sanctioner,
        role: 'VC / Registrar',
        details: remarks || `Returned for clarification to ${targetLabel}.`,
        timestamp
      });
    } else if (action === 'reject') {
      request.status = 'Rejected';
      request.vcRegistrarApproval = {
        decision: 'Rejected',
        remarks: remarks || 'Administrative sanction declined due to institutional budgetary limits.',
        decidedBy: sanctioner,
        decidedAt: timestamp
      };

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: 'Administrative Sanction Denied',
        performedBy: sanctioner,
        role: 'VC / Registrar',
        details: remarks || 'Sanction denied by VC / Registrar.',
        timestamp
      });
    } else {
      return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    await request.save();
    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process administrative sanction' },
      { status: 500 }
    );
  }
}
