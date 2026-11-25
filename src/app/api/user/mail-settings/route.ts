import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel } from '@/lib/models/UserProfile';
import { verifySmtpConnection } from '@/lib/emailService';

// GET: Retrieve the user's current mail settings
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter required' }, { status: 400 });
    }

    const user = await UserProfileModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const settings = user.mailSettings || {};

    return NextResponse.json({
      success: true,
      canUseOfficialEmail: Boolean(user.canUseOfficialEmail),
      mailSettings: {
        smtpHost: settings.smtpHost || 'smtp.gmail.com',
        smtpPort: settings.smtpPort || 465,
        smtpUser: settings.smtpUser || user.email,
        senderName: settings.senderName || user.name,
        isConfigured: Boolean(settings.isConfigured),
        hasPassword: Boolean(settings.smtpPass && settings.smtpPass.length > 0),
        lastTestedAt: settings.lastTestedAt || ''
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save and/or test user's mail settings
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, smtpPass, senderName, testRecipient, testOnly } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserProfileModel.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    if (!user.canUseOfficialEmail && user.designation !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to configure personal official mailbox dispatch. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const currentSettings = user.mailSettings || {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 465,
      smtpUser: cleanEmail,
      smtpPass: '',
      senderName: user.name,
      isConfigured: false
    };

    const passToUse = smtpPass ? smtpPass.replace(/\s+/g, '') : currentSettings.smtpPass;

    if (!passToUse) {
      return NextResponse.json({ success: false, error: 'Please enter your 16-character Google App Password.' }, { status: 400 });
    }

    const config = {
      host: 'smtp.gmail.com',
      port: 465,
      user: cleanEmail,
      pass: passToUse,
      senderName: senderName || user.name
    };

    // Verify SMTP connection
    const testResult = await verifySmtpConnection(config, testRecipient || cleanEmail);
    if (!testResult.success) {
      return NextResponse.json({ success: false, error: testResult.message }, { status: 400 });
    }

    if (!testOnly) {
      user.mailSettings = {
        smtpHost: config.host,
        smtpPort: config.port,
        smtpUser: config.user,
        smtpPass: passToUse,
        senderName: config.senderName,
        isConfigured: true,
        lastTestedAt: new Date().toISOString()
      };
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: testResult.message,
      isConfigured: true,
      lastTestedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
