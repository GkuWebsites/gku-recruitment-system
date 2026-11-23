import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel, UserDesignation } from '@/lib/models/UserProfile';

// Default Institutional Accounts for immediate system access
const DEFAULT_ACCOUNTS: {
  name: string;
  email: string;
  password: string;
  designation: UserDesignation;
  department: string;
  phone: string;
  status: 'Active' | 'Inactive';
}[] = [
  {
    name: 'System Administrator',
    email: 'admin@gku.ac.in',
    password: 'admin123',
    designation: 'Admin',
    department: 'Administration & IT Cell',
    phone: '+91 98721 00001',
    status: 'Active'
  },
  {
    name: 'Central HR Directorate',
    email: 'hr@gku.ac.in',
    password: 'admin123',
    designation: 'HR',
    department: 'Human Resources Directorate',
    phone: '+91 98721 00002',
    status: 'Active'
  },
  {
    name: 'Dean Academic Affairs',
    email: 'deanacademic@gku.ac.in',
    password: 'admin123',
    designation: 'Dean Academic',
    department: 'Office of Dean Academic Affairs',
    phone: '+91 98721 00003',
    status: 'Active'
  },
  {
    name: 'Dean Faculty of Sciences & Technology',
    email: 'dean@gku.ac.in',
    password: 'admin123',
    designation: 'Dean',
    department: 'Faculty of Engineering & Technology',
    phone: '+91 98721 00004',
    status: 'Active'
  },
  {
    name: 'Vice Chancellor & Registrar Secretariat',
    email: 'vc@gku.ac.in',
    password: 'admin123',
    designation: 'VC / Registrar',
    department: 'Vice Chancellor Secretariat',
    phone: '+91 98721 00005',
    status: 'Active'
  },
  {
    name: 'Campus Director',
    email: 'director@gku.ac.in',
    password: 'admin123',
    designation: 'Director',
    department: 'Directorate of Academic Institutions',
    phone: '+91 98721 00006',
    status: 'Active'
  }
];

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

    const cleanEmail = email.toLowerCase().trim();

    // Ensure default institutional account exists if requested
    const defaultAcc = DEFAULT_ACCOUNTS.find(a => a.email === cleanEmail);
    if (defaultAcc) {
      const exists = await UserProfileModel.findOne({ email: cleanEmail });
      if (!exists) {
        await UserProfileModel.create(defaultAcc);
      }
    }
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
