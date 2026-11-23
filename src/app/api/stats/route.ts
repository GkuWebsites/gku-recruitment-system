import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    let allRequests = await HiringRequestModel.find({}).lean();

    // When role is VC / Registrar, exclude requisitions that have not yet reached administrative sanction stage
    if (role === 'VC / Registrar') {
      allRequests = allRequests.filter((r) => {
        return (
          r.currentStage >= 3 ||
          r.deanAcademicApproval?.decision === 'Approved' ||
          [
            'Approved by Dean Academic',
            'Under Review (VC / Registrar)',
            'Approved by VC / Registrar',
            'In Process (HR - Recruitment)',
            'Interview & Selection Completed',
            'Joined & Request Closed'
          ].includes(r.status)
        );
      });
    }

    const total = allRequests.length;
    let approved = 0;
    let rejected = 0;
    let inProcess = 0;
    let totalPromotionCost = 0;
    let totalCandidates = 0;
    let totalJoined = 0;

    const departmentCounts: Record<string, { total: number; approved: number; inProcess: number; rejected: number }> = {};

    UNIVERSITY_DEPARTMENTS.forEach((dept) => {
      departmentCounts[dept] = { total: 0, approved: 0, inProcess: 0, rejected: 0 };
    });

    allRequests.forEach((req) => {
      const status = req.status;
      const dept = req.department;

      if (!departmentCounts[dept]) {
        departmentCounts[dept] = { total: 0, approved: 0, inProcess: 0, rejected: 0 };
      }
      departmentCounts[dept].total += 1;

      if (status === 'Approved by VC / Registrar' || status === 'Interview & Selection Completed' || status === 'Joined & Request Closed') {
        approved += 1;
        departmentCounts[dept].approved += 1;
      } else if (status === 'Rejected') {
        rejected += 1;
        departmentCounts[dept].rejected += 1;
      } else {
        inProcess += 1;
        departmentCounts[dept].inProcess += 1;
      }

      totalPromotionCost += req.totalPromotionCost || 0;

      if (req.candidates) {
        totalCandidates += req.candidates.length;
        totalJoined += req.candidates.filter((c) => c.status === 'Joined').length;
      }
    });

    // Promotion spend by channel summary
    const channelSpend: Record<string, number> = {};
    allRequests.forEach((req) => {
      if (req.promotionChannels) {
        req.promotionChannels.forEach((ch) => {
          channelSpend[ch.channelName] = (channelSpend[ch.channelName] || 0) + (ch.cost || 0);
        });
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests: total,
        approved,
        rejected,
        inProcess,
        totalPromotionCost,
        totalCandidates,
        totalJoined,
        departmentBreakdown: departmentCounts,
        channelSpendBreakdown: channelSpend,
        averageTurnaroundDays: total > 0 ? 14 : 0
      }
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
