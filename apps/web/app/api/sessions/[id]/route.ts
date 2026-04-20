// apps/web/app/api/sessions/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Update the type to a Promise
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Await the params before using them
    const { id } = await params;

    const session = await prisma.session.findUnique({
      where: {
        id: id,
        userId: userId 
      }
    });

    if (!session) return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json({
      ...session,
      graphData: JSON.parse(session.graphData)
    });
  } catch (error) {
    console.error("Fetch Session Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}