import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { DepartmentModel } from '@/lib/models/Department';
import { UNIVERSITY_DEPARTMENTS } from '@/lib/constants';

export async function GET() {
  try {
    await connectToDatabase();
    const customDepts = await DepartmentModel.find({}).sort({ name: 1 }).lean();
    
    // Combine standard university departments with any custom ones
    const combinedSet = new Set<string>(UNIVERSITY_DEPARTMENTS);
    customDepts.forEach((d) => {
      if (d.name && d.name.trim()) {
        combinedSet.add(d.name.trim());
      }
    });

    const list = Array.from(combinedSet);

    return NextResponse.json({
      success: true,
      data: list,
      customDepartments: customDepts
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, code, faculty, createdBy } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Department name is required' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();

    // Check if department already exists either in constants or in DB
    const inConstants = UNIVERSITY_DEPARTMENTS.some(
      (d) => d.toLowerCase() === cleanName.toLowerCase()
    );
    const existing = await DepartmentModel.findOne({
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });

    if (inConstants || existing) {
      return NextResponse.json(
        { success: false, error: `Department "${cleanName}" already exists.` },
        { status: 409 }
      );
    }

    const newDept = new DepartmentModel({
      name: cleanName,
      code: code?.trim() || '',
      faculty: faculty?.trim() || '',
      createdBy: createdBy || 'University Administration'
    });

    await newDept.save();

    return NextResponse.json({
      success: true,
      message: `Department "${cleanName}" created successfully`,
      data: newDept
    }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create department' },
      { status: 500 }
    );
  }
}
