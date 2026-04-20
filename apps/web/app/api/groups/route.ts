import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// Helper to generate a random 6-character code like "FLW-9X2"
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `FLW-${code.substring(0, 3)}${code.substring(3, 6)}`;
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const inviteCode = generateInviteCode();
    
    // Create the group AND add the host as the first member in one transaction
    const newGroup = await prisma.group.create({
      data: {
        name: "New Battle Room",
        inviteCode,
        hostId: userId,
        members: {
          create: {
            userId: userId
          }
        }
      }
    });

    return NextResponse.json(newGroup);
  } catch (error) {
    console.error("Create Group Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}