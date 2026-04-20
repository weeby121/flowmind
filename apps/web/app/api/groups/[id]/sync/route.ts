import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// GET: Students poll this to see if the game has started
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { isQuizActive: true, quizData: true }
    });

    if (!group) return new NextResponse("Group not found", { status: 404 });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Sync GET Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST: The Host calls this to save the questions and start the game
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: groupId } = await params;
    const body = await req.json();
    const { quizData } = body;

    // Verify the user is actually the host before allowing them to start it
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group?.hostId !== userId) {
      return new NextResponse("Only the host can start the game", { status: 403 });
    }

    // Save the questions and set the game to active
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        isQuizActive: true,
        quizData: quizData
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Sync POST Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}