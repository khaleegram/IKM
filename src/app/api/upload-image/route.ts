import { getAdminApp } from '@/lib/firebase/admin';
import { uploadImageToStorage } from '@/lib/storage-actions';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication by checking session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(process.env.AUTH_COOKIE_NAME || 'AuthToken')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload images' },
        { status: 401 }
      );
    }

    // Verify the session cookie
    let userId: string;
    try {
      const adminApp = getAdminApp();
      const auth = getAuth(adminApp);
      const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Session cookie verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
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

