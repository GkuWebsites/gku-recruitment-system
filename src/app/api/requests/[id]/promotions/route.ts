import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { HiringRequestModel } from '@/lib/models/HiringRequest';
import { PromotionChannel } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const request = await HiringRequestModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }]
    });

    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const channelId = `prom-${Date.now()}`;
    const newChannel: PromotionChannel = {
      id: channelId,
      channelName: body.channelName,
      cost: Number(body.cost) || 0,
      postDate: body.postDate || new Date().toISOString().split('T')[0],
      expiryDate: body.expiryDate || '',
      urlOrRef: body.urlOrRef || '',
      notes: body.notes || ''
    };

    request.promotionChannels.push(newChannel);
    request.totalPromotionCost = request.promotionChannels.reduce((sum, item) => sum + (item.cost || 0), 0);

    const timestamp = new Date().toISOString();
    request.auditTrail.unshift({
      id: `audit-${Date.now()}`,
      action: 'Advertising Channel Added',
      performedBy: body.actorName || 'HR Media Cell',
      role: 'HR Department',
      details: `Published on ${newChannel.channelName} (Budget: ₹${newChannel.cost.toLocaleString()})`,
      timestamp
    });

    await request.save();
    return NextResponse.json({
      success: true,
      data: request.promotionChannels,
      totalPromotionCost: request.totalPromotionCost
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to add promotion channel' },
      { status: 500 }
    );
  }
}
