import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { checkAdminApiAccess } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const access = await checkAdminApiAccess();
  if (!access.authorized) return access.errorResponse!;

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body as ReadableStream, {
      access: 'public',
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error: any) {
    console.error("Vercel Blob Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
