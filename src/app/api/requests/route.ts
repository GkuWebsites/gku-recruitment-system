import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const stage = searchParams.get('stage');

    const query: Record<string, unknown> = {};

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (stage && stage !== 'All') {
      query.currentStage = parseInt(stage, 10);
    }

    if (search) {
      query.$or = [
        { requestId: { $regex: search, $options: 'i' } },
        { postTitle: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { 'creator.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Role-specific scoping:
    // When role is 'VC / Registrar', only show requisitions that have passed Dean Academic review!
    // New job requirements submitted by Deans are visible only to Dean Academic and HR until approved.
    if (role === 'VC / Registrar') {
      query.$or = [
        { currentStage: { $gte: 3 } },
        { 'deanAcademicApproval.decision': 'Approved' },
        {
          status: {
            $in: [
              'Approved by Dean Academic',
              'Under Review (VC / Registrar)',
              'Approved by VC / Registrar',
              'In Process (HR - Recruitment)',
              'Interview & Selection Completed',
              'Joined & Request Closed'
            ]
          }
        }
      ];
    }

    const requests = await HiringRequestModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: requests.length, data: requests });
  } catch (error: unknown) {
    console.error('Failed to fetch hiring requests:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Database connection error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Auto-generate request ID
    const count = await HiringRequestModel.countDocuments();
    const year = new Date().getFullYear();
    const requestId = `REQ-${year}-${String(count + 1).padStart(3, '0')}`;

    const timestamp = new Date().toISOString();

    const routing = body.approvalRouting || 'standard_academic';
    let status = 'Request Submitted (Department)';
    let currentStage = 1;
    let deanAcademicApproval: any = undefined;
    let vcRegistrarApproval: any = undefined;
    let auditAction = 'Requisition Created';
    let auditDetails = `Hiring requisition submitted for ${body.numberOfPositions} position(s) of ${body.postTitle}`;

    if (routing === 'direct_hr_order') {
      status = 'In Process (HR - Recruitment)';
      currentStage = 4;
      deanAcademicApproval = {
        decision: 'Approved',
        remarks: 'Pre-cleared under Direct Executive Institutional Hiring Protocol.',
        decidedBy: body.creatorName || 'Director of HR & Recruitment',
        decidedAt: timestamp
      };
      vcRegistrarApproval = {
        decision: 'Approved',
        remarks: 'Direct Institutional Requirement sanctioned under Executive Authority.',
        decidedBy: body.creatorName || 'Director of HR & Recruitment',
        decidedAt: timestamp
      };
      auditAction = 'Direct Executive Requisition Created';
      auditDetails = `Direct requisition created & sanctioned under Executive Authority for ${body.numberOfPositions} position(s) of ${body.postTitle}. Ready for posting & candidate intake.`;
    } else if (routing === 'route_vc') {
      status = 'Under Review (VC / Registrar)';
      currentStage = 3;
      deanAcademicApproval = {
        decision: 'Approved',
        remarks: 'Forwarded directly by HR Directorate for VC / Registrar Executive Sanction.',
        decidedBy: body.creatorName || 'Director of HR & Recruitment',
        decidedAt: timestamp
      };
      auditAction = 'Requisition Created - Routed to VC / Registrar';
      auditDetails = `Hiring requisition created by HR and forwarded directly to VC & Registrar for formal sanction.`;
    }

    const creatorRole = body.creatorRole || (routing === 'direct_hr_order' || routing === 'route_vc' ? 'HR Department' : 'Department / Dean');
    const creatorEmail = body.creatorEmail || (creatorRole === 'HR Department' ? 'hr@gku.ac.in' : 'dean@gku.ac.in');
    const creatorName = body.creatorName || (creatorRole === 'HR Department' ? 'Director of HR & Recruitment' : 'Department Dean');

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
      jobDescriptionFile: body.jobDescriptionFile || undefined,
      creator: {
        name: creatorName,
        role: creatorRole,
        email: creatorEmail
      },
      status,
      currentStage,
      deanAcademicApproval,
      vcRegistrarApproval,
      promotionChannels: [],
      totalPromotionCost: 0,
      candidates: [],
      comments: body.initialComment
        ? [
            {
              id: `c-${Date.now()}`,
              authorName: creatorName,
              authorRole: creatorRole,
              text: body.initialComment,
              timestamp,
              category: 'Remark'
            }
          ]
        : [],
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          action: auditAction,
          performedBy: creatorName,
          role: creatorRole,
          details: auditDetails,
          timestamp
        }
      ]
    });

    const saved = await newRequest.save();
    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create hiring request:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create request' },
      { status: 500 }
    );
  }
}
