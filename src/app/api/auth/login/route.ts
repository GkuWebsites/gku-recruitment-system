import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel } from '@/lib/models/UserProfile';

// Default Administrator Credentials
const DEFAULT_ADMIN: {
  name: string;
  email: string;
  password: string;
  designation: 'Admin';
  department: string;
  phone: string;
  status: 'Active';
} = {
  name: 'System Administrator',
  email: 'admin@gurukashiuniv.edu.in',
  password: 'admin123',
  designation: 'Admin',
  department: 'Administration & IT Cell',
  phone: '+91 98721 00001',
  status: 'Active'
};

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Ensure default admin exists
    const adminExists = await UserProfileModel.findOne({ email: DEFAULT_ADMIN.email });
    if (!adminExists) {
      await UserProfileModel.create(DEFAULT_ADMIN);
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await UserProfileModel.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User with this email not found' },
        { status: 404 }
      );
    }

    const expectedPassword = user.password || 'admin123';
    if (expectedPassword !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    if (user.status !== 'Active') {
      return NextResponse.json(
        { success: false, error: 'Your user profile is inactive. Contact Administrator.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
