
'use client';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage } from '@/firebase';

export const uploadImage = async (userId: string, file: File): Promise<string> => {
    const storage = getFirebaseStorage();
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }

    const filePath = `product_images/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
};

    