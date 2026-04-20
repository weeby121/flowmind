// apps/web/app/api/sessions/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET: Fetch all saved sessions for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true } // We only need the ID and Title for the Sidebar
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Database Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: Save a newly generated graph to the database
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, graphData } = body;

    const newSession = await prisma.session.create({
      data: {
        userId,
        title,
        graphData: JSON.stringify(graphData), // Prisma stores this as a string
      }
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Database Save Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}