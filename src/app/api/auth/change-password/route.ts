import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel } from '@/lib/models/UserProfile';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, current password, and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await UserProfileModel.findOne({ email: cleanEmail });

    if (!user) {
      // Check if it's one of the default accounts
      if (currentPassword !== 'admin123') {
        return NextResponse.json(
          { success: false, error: 'Current password does not match.' },
          { status: 401 }
        );
      }

      // Create new profile record with updated password
      user = new UserProfileModel({
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        password: newPassword.trim(),
        designation: cleanEmail.includes('hr')
          ? 'HR'
          : cleanEmail.includes('admin')
          ? 'Admin'
          : cleanEmail.includes('vc')
          ? 'Vice Chancellor'
          : cleanEmail.includes('registrar')
          ? 'Registrar'
          : cleanEmail.includes('deanacademic')
          ? 'Dean Academic'
          : 'Dean',
        department: 'Guru Kashi University',
        status: 'Active'
      });
      await user.save();

      return NextResponse.json({
        success: true,
        message: 'Password updated and official profile synced successfully.'
      });
    }

    // Verify current password
    if (user.password !== currentPassword.trim()) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password. Please try again.' },
        { status: 401 }
      );
    }

    user.password = newPassword.trim();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! Please use your new password next time you sign in.'
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
