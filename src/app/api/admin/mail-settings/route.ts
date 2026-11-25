import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { SystemSettingsModel } from '@/lib/models/SystemSettings';
import { verifySmtpConnection } from '@/lib/emailService';

// GET: Fetch central university mail desks status
export async function GET() {
  try {
    await connectToDatabase();
    let settings = await SystemSettingsModel.findOne({ key: 'global_settings' });

    if (!settings) {
      settings = await SystemSettingsModel.create({
        key: 'global_settings'
      });
    }

    const hr = settings.centralMailDesks?.hr || {
      deskId: 'hr',
      deskName: 'Directorate of HR & Faculty Affairs',
      email: 'hr@gku.ac.in',
      isConfigured: false
    };

    const hrm = settings.centralMailDesks?.hrm || {
      deskId: 'hrm',
      deskName: 'GKU Talent Acquisition & Recruitment Portal',
      email: 'hrm@gku.ac.in',
      isConfigured: false
    };

    return NextResponse.json({
      success: true,
      desks: {
        hr: {
          deskId: 'hr',
          deskName: hr.deskName,
          email: hr.email,
          isConfigured: Boolean(hr.isConfigured),
          hasPassword: Boolean(hr.smtpPass && hr.smtpPass.length > 0),
          lastTestedAt: hr.lastTestedAt || ''
        },
        hrm: {
          deskId: 'hrm',
          deskName: hrm.deskName,
          email: hrm.email,
          isConfigured: Boolean(hrm.isConfigured),
          hasPassword: Boolean(hrm.smtpPass && hrm.smtpPass.length > 0),
          lastTestedAt: hrm.lastTestedAt || ''
        }
      },
      allowedCorporateEmailUsers: settings.allowedCorporateEmailUsers || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save and/or test central mail desk configuration
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { deskId, deskName, email, smtpPass, testRecipient, testOnly } = body;

    if (!deskId || !['hr', 'hrm'].includes(deskId)) {
      return NextResponse.json({ success: false, error: 'Invalid deskId (must be hr or hrm)' }, { status: 400 });
    }

    let settings = await SystemSettingsModel.findOne({ key: 'global_settings' });
    if (!settings) {
      settings = await SystemSettingsModel.create({ key: 'global_settings' });
    }

    const targetDesk = settings.centralMailDesks[deskId as 'hr' | 'hrm'];
    const passToUse = smtpPass ? smtpPass.replace(/\s+/g, '') : targetDesk.smtpPass;

    if (!passToUse) {
      return NextResponse.json({ success: false, error: 'Please enter the Google App Password for this desk.' }, { status: 400 });
    }

    const config = {
      host: 'smtp.gmail.com',
      port: 465,
      user: email || targetDesk.email,
      pass: passToUse,
      senderName: deskName || targetDesk.deskName
    };

    const testResult = await verifySmtpConnection(config, testRecipient || config.user);
    if (!testResult.success) {
      return NextResponse.json({ success: false, error: testResult.message }, { status: 400 });
    }

    if (!testOnly) {
      targetDesk.deskName = config.senderName;
      targetDesk.email = config.user;
      targetDesk.smtpHost = 'smtp.gmail.com';
      targetDesk.smtpPort = 465;
      targetDesk.smtpUser = config.user;
      targetDesk.smtpPass = passToUse;
      targetDesk.isConfigured = true;
      targetDesk.lastTestedAt = new Date().toISOString();

      settings.markModified('centralMailDesks');
      await settings.save();
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
