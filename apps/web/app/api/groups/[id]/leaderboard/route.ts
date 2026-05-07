import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET: Fetch the ranked leaderboard
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params;
    
    // Grab all members who finished, ordered by highest score
    const members = await prisma.groupMember.findMany({
      where: { groupId, isFinished: true },
      orderBy: { score: 'desc' },
      select: { userName: true, score: true, userId: true }
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Leaderboard GET Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Submit a user's final score
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser(); // Grab full user to get their name
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const { id: groupId } = await params;
    const { score } = await req.json();

    // Upsert safely creates the record if they didn't officially "join" the DB yet, 
    // or updates their score if they are already in the group.
    const member = await prisma.groupMember.upsert({
      where: {
        groupId_userId: { groupId, userId: user.id }
      },
      update: {
        score,
        isFinished: true,
        userName: user.firstName || "Anonymous Scholar"
      },
      create: {
        groupId,
        userId: user.id,
        score,
        isFinished: true,
        userName: user.firstName || "Anonymous Scholar"
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Leaderboard POST Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}