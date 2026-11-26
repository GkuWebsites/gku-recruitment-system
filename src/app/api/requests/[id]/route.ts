import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    }).lean();

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to retrieve request' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const existing = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const userRole = body.userRole || body.actorRole || searchParams.get('userRole') || searchParams.get('role');
    const isHRorAdmin =
      userRole === 'HR' ||
      userRole === 'HR Department' ||
      userRole === 'Admin' ||
      userRole === 'System Administrator';

    // If Dean / HOD: can ONLY edit UNTIL reviewed by Dean Academic
    if (!isHRorAdmin) {
      const isReviewedByDeanAcademic =
        (existing.currentStage || 1) >= 3 ||
        existing.status === 'Approved by Dean Academic' ||
        existing.status === 'Under Review (VC / Registrar)' ||
        existing.status === 'Approved by VC / Registrar' ||
        existing.status === 'In Process (HR - Recruitment)' ||
        existing.status === 'Position Fulfilled (Recruitment Completed)' ||
        (existing.deanAcademicApproval && existing.deanAcademicApproval.decision === 'Approved');

      if (isReviewedByDeanAcademic) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This requisition has already been reviewed by Dean Academic and can no longer be edited by the department.'
          },
          { status: 403 }
        );
      }
    }

    // Clean body of permission metadata before updating
    const updateData = { ...body };
    delete updateData.userRole;
    delete updateData.actorRole;

    const request = await HiringRequestModel.findOneAndUpdate(
      { _id: existing._id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userRole = searchParams.get('userRole') || searchParams.get('role');

    const existing = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const isHRorAdmin =
      userRole === 'HR' ||
      userRole === 'HR Department' ||
      userRole === 'Admin' ||
      userRole === 'System Administrator';

    // If Dean / HOD: can ONLY delete UNTIL reviewed by Dean Academic
    if (!isHRorAdmin) {
      const isReviewedByDeanAcademic =
        (existing.currentStage || 1) >= 3 ||
        existing.status === 'Approved by Dean Academic' ||
        existing.status === 'Under Review (VC / Registrar)' ||
        existing.status === 'Approved by VC / Registrar' ||
        existing.status === 'In Process (HR - Recruitment)' ||
        existing.status === 'Position Fulfilled (Recruitment Completed)' ||
        (existing.deanAcademicApproval && existing.deanAcademicApproval.decision === 'Approved');

      if (isReviewedByDeanAcademic) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This requisition has already been reviewed by Dean Academic and can no longer be deleted by the department.'
          },
          { status: 403 }
        );
      }
    }

    await HiringRequestModel.deleteOne({ _id: existing._id });

    return NextResponse.json({
      success: true,
      message: `Requisition ${existing.requestId} deleted successfully`
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete request' },
      { status: 500 }
    );
  }
}
