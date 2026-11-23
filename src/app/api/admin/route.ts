import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel, IUserProfile } from '@/lib/models/UserProfile';

// Default baseline profiles for Guru Kashi University with valid UserDesignations
const INITIAL_PROFILES: IUserProfile[] = [
  {
    name: 'System Administrator',
    email: 'admin@gku.ac.in',
    designation: 'Admin',
    department: 'Administration & IT Cell',
    phone: '+91 98721 00001',
    status: 'Active'
  },
  {
    name: 'Dr. Harpreet Singh',
    email: 'dean@gku.ac.in',
    designation: 'Dean',
    department: 'Computer Science & Engineering',
    phone: '+91 98721 00101',
    status: 'Active'
  },
  {
    name: 'Prof. (Dr.) Balwant Singh',
    email: 'deanacademic@gku.ac.in',
    designation: 'Dean Academic',
    department: 'Academic Council & Scrutiny',
    phone: '+91 98721 00201',
    status: 'Active'
  },
  {
    name: 'Dr. Maninder Kaur',
    email: 'director@gku.ac.in',
    designation: 'Director',
    department: 'Management Studies',
    phone: '+91 98721 00102',
    status: 'Active'
  },
  {
    name: 'Prof. (Dr.) Gurinder Singh',
    email: 'vc@gku.ac.in',
    designation: 'VC / Registrar',
    department: "Vice Chancellor's Secretariat",
    phone: '+91 98721 00301',
    status: 'Active'
  },
  {
    name: 'Mr. Vikram Sharma',
    email: 'hr@gku.ac.in',
    designation: 'HR',
    department: 'HR Recruitment Cell',
    phone: '+91 98721 00401',
    status: 'Active'
  }
];

// GET /api/admin: List all profiles or seed defaults
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const designation = searchParams.get('designation') || searchParams.get('role');

    let query: Record<string, any> = {};
    if (designation && designation !== 'All') {
      query.designation = designation;
    }

    let profiles = await UserProfileModel.find(query).sort({ createdAt: -1 });

    if (profiles.length === 0) {
      await UserProfileModel.insertMany(INITIAL_PROFILES);
      profiles = await UserProfileModel.find(query).sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch user profiles' },
      { status: 500 }
    );
  }
}

// POST /api/admin: Create a new user profile
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { name, email, password, designation, department, phone, status } = body;

    if (!name || !email || !designation) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and designation are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await UserProfileModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A profile with email "${cleanEmail}" already exists.` },
        { status: 409 }
      );
    }

    const newProfile = await UserProfileModel.create({
      name: name.trim(),
      email: cleanEmail,
      password: password || 'password123',
      designation,
      department: department?.trim() || '',
      phone: phone?.trim() || '',
      status: status || 'Active'
    });

    return NextResponse.json({
      success: true,
      data: newProfile
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin: Update an existing profile (e.g. toggle active/inactive)
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: 'User ID and updates object required' },
        { status: 400 }
      );
    }

    const updated = await UserProfileModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin: Delete a profile
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const deleted = await UserProfileModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete user profile' },
      { status: 500 }
    );
  }
}
