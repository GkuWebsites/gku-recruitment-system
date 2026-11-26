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
    const userEmail = searchParams.get('userEmail');
    const userRole = searchParams.get('userRole');
    const userDepartment = searchParams.get('userDepartment');

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
    // 1. Department / Dean role: Strictly isolated to own requisitions or HR requisitions marked visibleToDean
    const isDean = role === 'Department / Dean' || userRole === 'Dean' || userRole === 'HOD' || userRole === 'Director';
    if (isDean) {
      const orConditions: any[] = [];
      if (userEmail) {
        orConditions.push({ 'creator.email': { $regex: `^${userEmail.trim()}$`, $options: 'i' } });
      }
      if (userDepartment) {
        orConditions.push({
          department: userDepartment,
          visibleToDean: true
        });
      }
      if (orConditions.length > 0) {
        query.$or = orConditions;
      } else {
        query._id = null;
      }
    } else if (role === 'VC / Registrar') {
      // When role is 'VC / Registrar', only show requisitions that have passed Dean Academic review!
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

    const routing = body.approvalRouting || 'standard_academic';
    let status = 'Request Submitted (Department)';
    let currentStage = 1;
    let deanAcademicApproval: any = undefined;
    let vcRegistrarApproval: any = undefined;
    let auditAction = 'Requisition Created';
    let auditDetails = `Hiring requisition submitted for ${body.numberOfPositions} position(s) of ${body.postTitle}`;

    const authorities: string[] = Array.isArray(body.authorities) && body.authorities.length > 0
      ? body.authorities
      : ['Vice-Chancellor (VC)', 'Registrar'];
    const authorityStr = authorities.join(' & ');

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
        remarks: 'Direct Recruitment requirement created & sanctioned under HR Directorate Authority (VC/Registrar approval bypassed).',
        decidedBy: body.creatorName || 'Director of HR & Recruitment',
        decidedAt: timestamp
      };
      auditAction = 'Direct Recruitment Created';
      auditDetails = `Direct requisition created & published under HR Directorate Authority without seeking VC/Registrar approval for ${body.numberOfPositions} position(s) of ${body.postTitle}. Active in pipeline.`;
    } else if (routing === 'route_vc') {
      status = 'Under Review (VC / Registrar)';
      currentStage = 3;
      deanAcademicApproval = {
        decision: 'Approved',
        remarks: `Forwarded directly by HR Directorate for formal ${authorityStr} Executive Sanction.`,
        decidedBy: body.creatorName || 'Director of HR & Recruitment',
        decidedAt: timestamp
      };
      auditAction = `Requisition Created - Routed to ${authorityStr}`;
      auditDetails = `Hiring requisition created by HR Directorate and submitted for formal executive approval to: ${authorityStr}.`;
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
      tentativeBudget: body.tentativeBudget || (creatorRole === 'HR Department' ? '₹8,40,000 – ₹10,80,000 p.a.' : 'To be decided by HR'),
      budgetAmountNumber: Number(body.budgetAmountNumber) || 0,
      urgency: body.urgency || 'Normal',
      jobDescriptionFile: body.jobDescriptionFile || undefined,
      creator: {
        name: creatorName,
        role: creatorRole,
        email: creatorEmail
      },
      visibleToDean: body.visibleToDean ?? (creatorRole === 'HR Department' ? false : true),
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
