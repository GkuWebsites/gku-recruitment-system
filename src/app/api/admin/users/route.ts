import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserProfileModel, IUserProfile } from '@/lib/models/UserProfile';

const SEED_PROFILES: IUserProfile[] = [
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
    name: 'Dr. Harpreet Singh',
    email: 'dean@gku.ac.in',
    password: 'admin123',
    designation: 'Dean',
    department: 'Computer Science & Engineering',
    phone: '+91 98721 00101',
    status: 'Active'
  },
  {
    name: 'Prof. (Dr.) Balwant Singh',
    email: 'deanacademic@gku.ac.in',
    password: 'admin123',
    designation: 'Dean Academic',
    department: 'Academic Council & Scrutiny',
    phone: '+91 98721 00201',
    status: 'Active'
  },
  {
    name: 'Dr. Maninder Kaur',
    email: 'director@gku.ac.in',
    password: 'admin123',
    designation: 'Director',
    department: 'Management Studies',
    phone: '+91 98721 00102',
    status: 'Active'
  },
  {
    name: 'Prof. (Dr.) Gurinder Singh',
    email: 'vc@gku.ac.in',
    password: 'admin123',
    designation: 'VC / Registrar',
    department: "Vice Chancellor's Secretariat",
    phone: '+91 98721 00301',
    status: 'Active'
  },
  {
    name: 'Mr. Vikram Sharma',
    email: 'hr@gku.ac.in',
    password: 'admin123',
    designation: 'HR',
    department: 'HR Recruitment Cell',
    phone: '+91 98721 00401',
    status: 'Active'
  }
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const designation = searchParams.get('designation');
    const search = searchParams.get('search');

    const count = await UserProfileModel.countDocuments();
    if (count === 0) {
      await UserProfileModel.insertMany(SEED_PROFILES);
    }

    const query: Record<string, unknown> = {};
    if (designation && designation !== 'All') {
      query.designation = designation;
    }

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ];
    }

    const users = await UserProfileModel.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: users.length, data: users });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, designation, department, phone } = body;

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
        { success: false, error: 'A user with this institutional email already exists.' },
        { status: 409 }
      );
    }

    const newUser = new UserProfileModel({
      name: name.trim(),
      email: cleanEmail,
      password: password?.trim() || 'password123',
      designation,
      department: department?.trim() || '',
      phone: phone?.trim() || '',
      status: 'Active'
    });

    await newUser.save();
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ success: false, error: 'id and updates are required' }, { status: 400 });
    }

    // Clean updates
    const sanitizedUpdates: Record<string, any> = {};

    if (updates.name) sanitizedUpdates.name = updates.name.trim();
    if (updates.email) {
      const cleanEmail = updates.email.toLowerCase().trim();
      // Ensure email uniqueness excluding self
      const existing = await UserProfileModel.findOne({ email: cleanEmail, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Another user is already registered with this institutional email.' },
          { status: 409 }
        );
      }
      sanitizedUpdates.email = cleanEmail;
    }
    if (updates.password && updates.password.trim()) {
      sanitizedUpdates.password = updates.password.trim();
    }
    if (updates.designation) sanitizedUpdates.designation = updates.designation;
    if (typeof updates.department === 'string') sanitizedUpdates.department = updates.department.trim();
    if (typeof updates.phone === 'string') sanitizedUpdates.phone = updates.phone.trim();
    if (updates.status) sanitizedUpdates.status = updates.status;

    const updated = await UserProfileModel.findByIdAndUpdate(id, sanitizedUpdates, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User id is required' }, { status: 400 });
    }

    await UserProfileModel.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'User profile deleted successfully' });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
