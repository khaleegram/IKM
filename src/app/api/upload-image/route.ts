import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToStorage } from '@/lib/storage-actions';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const userId = (await headers()).get('X-User-UID');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const url = await uploadImageToStorage(buffer, file.name, folder);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

