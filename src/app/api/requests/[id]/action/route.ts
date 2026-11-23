import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { HiringStatus, UserRole } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const {
      action, // 'dean_approve' | 'dean_reject' | 'dean_query' | 'vc_approve' | 'vc_reject' | 'vc_query' | 'hr_start' | 'hr_complete_selection' | 'hr_close' | 'dept_resubmit'
      remarks,
      actorName,
      actorRole
    }: {
      action: string;
      remarks?: string;
      actorName: string;
      actorRole: UserRole;
    } = body;

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    let newStatus: HiringStatus = request.status;
    let newStage = request.currentStage;
    let auditAction = '';
    let auditDetails = remarks || '';

    switch (action) {
      case 'dean_approve':
        newStatus = 'Under Review (VC / Registrar)';
        newStage = 3;
        auditAction = 'Academic Clearance Approved — Dispatched to VC / Registrar';
        auditDetails = remarks || 'Dean Academic approved workload justification. Requisition forwarded to VC / Registrar for administrative sanction.';
        request.deanAcademicApproval = {
          decision: 'Approved',
          remarks: remarks || 'Academic workload and cadre requirements verified. Recommended and forwarded for administrative approval.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'dean_reject':
        newStatus = 'Rejected';
        auditAction = 'Academic Clearance Rejected';
        request.deanAcademicApproval = {
          decision: 'Rejected',
          remarks: remarks || 'Requisition does not satisfy minimum student-to-faculty norms.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'dean_query':
        newStatus = 'Returned for Clarification';
        auditAction = 'Clarification Requested by Dean Academic';
        request.deanAcademicApproval = {
          decision: 'Clarification',
          remarks: remarks || 'Please justify faculty teaching load and current semester allotment.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'vc_approve':
        if (!request.deanAcademicApproval || request.deanAcademicApproval.decision !== 'Approved') {
          return NextResponse.json(
            { success: false, error: 'Requisition must be approved by Dean Academic before VC / Registrar can sanction.' },
            { status: 400 }
          );
        }
        newStatus = 'In Process (HR - Recruitment)';
        newStage = 4;
        auditAction = 'Final Administrative & Financial Approval';
        request.vcRegistrarApproval = {
          decision: 'Approved',
          remarks: remarks || 'Sanction accorded as per approved institutional workforce plan and salary scale.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'vc_reject':
        newStatus = 'Rejected';
        auditAction = 'Administrative Sanction Denied';
        request.vcRegistrarApproval = {
          decision: 'Rejected',
          remarks: remarks || 'Financial allocation constrained for current academic quarter.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'vc_query':
        newStatus = 'Returned for Clarification';
        auditAction = 'Clarification Sought by VC Office';
        request.vcRegistrarApproval = {
          decision: 'Clarification',
          remarks: remarks || 'Furnish budget head details and comparative qualification guidelines.',
          decidedBy: actorName,
          decidedAt: timestamp
        };
        break;

      case 'dept_resubmit':
        newStatus = 'Under Review (Dean Academic)';
        newStage = 2;
        auditAction = 'Requisition Resubmitted with Clarifications';
        auditDetails = remarks || 'Additional justifications and documentation appended.';
        break;

      case 'hr_start':
        newStatus = 'In Process (HR - Recruitment)';
        newStage = 4;
        auditAction = 'Recruitment Drive Initiated';
        auditDetails = remarks || 'Sourcing, advertisements and candidate shortlisting commenced.';
        break;

      case 'hr_advance_interview':
        newStage = 5;
        auditAction = 'Interview Panels Convened';
        auditDetails = remarks || 'Candidates shortlisted and panel assessments scheduled.';
        break;

      case 'hr_complete_selection':
        newStatus = 'Interview & Selection Completed';
        newStage = 5;
        auditAction = 'Selection Committee Recommendation Finalized';
        auditDetails = remarks || 'Merit lists prepared and panel evaluation sheets signed.';
        break;

      case 'hr_advance_offer':
        newStage = 6;
        auditAction = 'Offer & Verification Stage Commenced';
        auditDetails = remarks || 'Issuing formal appointment letters and credential checks.';
        break;

      case 'hr_close':
        newStatus = 'Joined & Request Closed';
        newStage = 6;
        auditAction = 'Candidate Joined & Requisition Closed';
        auditDetails = remarks || 'Appointees inducted, biometric/employee codes generated, hiring cycle closed.';
        break;

      default:
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
    }

    request.status = newStatus;
    request.currentStage = newStage;

    // Append comment if remarks provided
    if (remarks) {
      request.comments.push({
        id: `c-${Date.now()}`,
        authorName: actorName,
        authorRole: actorRole,
        text: remarks,
        timestamp,
        category: action.includes('query') ? 'Query' : 'Remark'
      });
    }

    // Append to audit trail
    request.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      action: auditAction,
      performedBy: actorName || 'Authorized User',
      role: actorRole || 'System',
      details: auditDetails || 'Workflow transition executed successfully.',
      timestamp
    });

    await request.save();

    return NextResponse.json({
      success: true,
      message: auditAction,
      data: request
    });
  } catch (error: unknown) {
    console.error('Action error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process workflow action' },
      { status: 500 }
    );
  }
}
