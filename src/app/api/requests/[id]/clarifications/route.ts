import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { canUserViewThread, UserContext } from '@/lib/clarificationPermissions';
import { IClarificationThread, IClarificationMessage } from '@/lib/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const userEmail = searchParams.get('userEmail') || '';
    const userRole = searchParams.get('userRole') || '';
    const userDepartment = searchParams.get('userDepartment') || '';
    const userName = searchParams.get('userName') || '';

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    }).lean();

    if (!request) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const threads = (request.clarificationThreads || []) as IClarificationThread[];

    // If user context provided, filter visible threads based on permission rules
    if (userEmail && userRole) {
      const userContext: UserContext = {
        email: userEmail,
        name: userName,
        designation: userRole,
        department: userDepartment
      };

      const visibleThreads = threads.filter((t) => canUserViewThread(t, userContext, request));
      return NextResponse.json({ success: true, count: visibleThreads.length, data: visibleThreads });
    }

    return NextResponse.json({ success: true, count: threads.length, data: threads });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch clarification threads' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Requisition not found' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();

    // -------------------------------------------------------------
    // ACTION 1: CREATE A NEW CLARIFICATION THREAD
    // -------------------------------------------------------------
    if (action === 'create_thread') {
      const {
        subject,
        creatorName,
        creatorRole,
        creatorEmail,
        primaryRecipientRole,
        primaryRecipientEmail,
        primaryRecipientName,
        ccRecipients,
        messageText
      } = body;

      if (!subject || !messageText || !primaryRecipientRole) {
        return NextResponse.json(
          { success: false, error: 'Subject, messageText, and primaryRecipientRole are required' },
          { status: 400 }
        );
      }

      const threadId = `th-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const firstMessage: IClarificationMessage = {
        id: `msg-${Date.now()}-1`,
        senderName: creatorName || 'University Officer',
        senderRole: creatorRole || 'Officer',
        senderEmail: creatorEmail || 'officer@gurukashiuniv.edu.in',
        text: messageText,
        timestamp
      };

      // Determine recipient details (default to original submitting dean if Dept is targeted)
      let resolvedRecipientEmail = primaryRecipientEmail;
      let resolvedRecipientName = primaryRecipientName;
      if (primaryRecipientRole === 'Department / Dean' || primaryRecipientRole === 'Both') {
        resolvedRecipientEmail = resolvedRecipientEmail || request.creator.email;
        resolvedRecipientName = resolvedRecipientName || request.creator.name;
      }

      const newThread: IClarificationThread = {
        id: threadId,
        subject: subject.trim(),
        creatorName: creatorName || 'University Authority',
        creatorRole: creatorRole || 'Officer',
        creatorEmail: creatorEmail || 'officer@gurukashiuniv.edu.in',
        primaryRecipientRole,
        primaryRecipientEmail: resolvedRecipientEmail,
        primaryRecipientName: resolvedRecipientName,
        ccRecipients: Array.isArray(ccRecipients) ? ccRecipients : [],
        status: 'Open',
        createdAt: timestamp,
        updatedAt: timestamp,
        messages: [firstMessage]
      };

      if (!request.clarificationThreads) {
        request.clarificationThreads = [];
      }
      request.clarificationThreads.push(newThread);

      // Status updates
      request.status = 'Returned for Clarification';

      if (creatorRole === 'VC / Registrar') {
        request.vcRegistrarApproval = {
          decision: 'Clarification',
          remarks: messageText,
          decidedBy: creatorName,
          decidedAt: timestamp
        };
      } else if (creatorRole === 'Dean Academic') {
        request.deanAcademicApproval = {
          decision: 'Clarification',
          remarks: messageText,
          decidedBy: creatorName,
          decidedAt: timestamp
        };
      }

      const ccSummary = newThread.ccRecipients.map((c) => c.name).join(', ');
      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Clarification Thread Opened: "${newThread.subject}"`,
        performedBy: creatorName,
        role: creatorRole as any,
        details: `Dispatched to: ${primaryRecipientRole} (${resolvedRecipientName || 'Dean Academic'})${ccSummary ? ` | CC: ${ccSummary}` : ''}`,
        timestamp
      });

      request.markModified('clarificationThreads');
      await request.save();
      return NextResponse.json({ success: true, thread: newThread, data: request });
    }

    // -------------------------------------------------------------
    // ACTION 2: REPLY IN AN EXISTING THREAD (CONTINUOUS CHAT LOOP)
    // -------------------------------------------------------------
    if (action === 'reply_message') {
      const { threadId, senderName, senderRole, senderEmail, messageText } = body;

      if (!threadId || !messageText) {
        return NextResponse.json(
          { success: false, error: 'threadId and messageText are required' },
          { status: 400 }
        );
      }

      const thread = request.clarificationThreads?.find((t) => t.id === threadId);
      if (!thread) {
        return NextResponse.json(
          { success: false, error: `Clarification thread ${threadId} not found` },
          { status: 404 }
        );
      }

      const newMessage: IClarificationMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderName: senderName || 'Participant',
        senderRole: senderRole || 'Participant',
        senderEmail: senderEmail || '',
        text: messageText,
        timestamp
      };

      thread.messages.push(newMessage);
      thread.updatedAt = timestamp;
      thread.status = 'Open';

      // If Department Dean replies, move status back so Dean Academic sees the reply
      if (senderRole === 'Department / Dean' || senderRole === 'Dean' || senderRole === 'Director') {
        request.status = 'Under Review (Dean Academic)';
        request.currentStage = 2;
      }

      request.auditTrail.unshift({
        id: `audit-${Date.now()}`,
        action: `Clarification Reply in "${thread.subject}"`,
        performedBy: senderName,
        role: senderRole as any,
        details: messageText.length > 80 ? `${messageText.substring(0, 80)}...` : messageText,
        timestamp
      });

      request.markModified('clarificationThreads');
      await request.save();
      return NextResponse.json({ success: true, thread, data: request });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to process clarification action' },
      { status: 500 }
    );
  }
}
