import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const { authorName, authorRole, text, category } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'Comment text is required' }, { status: 400 });
    }

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();
    const commentItem = {
      id: `c-${Date.now()}`,
      authorName: authorName || 'University Official',
      authorRole: authorRole || 'Department / Dean',
      text: text.trim(),
      timestamp,
      category: category || 'Remark'
    };

    request.comments.push(commentItem);

    // Also record in audit trail
    request.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      action: `Note/Query Posted (${commentItem.category})`,
      performedBy: commentItem.authorName,
      role: commentItem.authorRole,
      details: commentItem.text,
      timestamp
    });

    await request.save();

    return NextResponse.json({ success: true, data: request.comments, newComment: commentItem });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to post comment' },
      { status: 500 }
    );
  }
}
