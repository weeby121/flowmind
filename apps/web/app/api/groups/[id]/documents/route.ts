import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

// 1. GET: Fetch existing documents when someone joins the room
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> } // Remember the Next.js 15+ Promise rule!
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: groupId } = await params;

    const docs = await prisma.groupDocument.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("Fetch Docs Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// 2. POST: Save a new document to the database
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: groupId } = await params;
    const body = await req.json();
    const { fileName } = body;

    if (!fileName) return new NextResponse("Filename missing", { status: 400 });

    const newDoc = await prisma.groupDocument.create({
      data: {
        groupId,
        fileName,
        uploadedBy: userId,
      }
    });

    return NextResponse.json(newDoc);
  } catch (error) {
    console.error("Upload Doc Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}