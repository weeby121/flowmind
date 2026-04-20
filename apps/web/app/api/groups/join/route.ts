import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { inviteCode } = body;

    if (!inviteCode) return new NextResponse("Invite code required", { status: 400 });

    // 1. Find the group by the code
    const group = await prisma.group.findUnique({
      where: { inviteCode }
    });

    if (!group) return new NextResponse("Invalid Invite Code", { status: 404 });

    // 2. Check if the user is already in the group
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: userId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json(group); // Already in? Just return the group so they can enter
    }

    // 3. Add the user to the group
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: userId
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Join Group Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}