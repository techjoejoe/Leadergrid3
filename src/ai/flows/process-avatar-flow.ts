
'use server';
/**
 * @fileOverview An AI flow to process user-uploaded avatars.
 * This flow takes a temporary image path, downloads it, resizes it to a square,
 * and re-uploads it to a permanent location in Firebase Storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import sharp from 'sharp';
import { PassThrough } from 'stream';

const ProcessAvatarInputSchema = z.object({
  tempStoragePath: z.string().describe('The full path to the temporary image in Firebase Storage.'),
  tempDownloadURL: z.string().url().describe('The temporary download URL of the image to process.'),
});

const ProcessAvatarOutputSchema = z.string().url().describe('The final, permanent URL of the processed avatar.');

export async function processAvatar(input: z.infer<typeof ProcessAvatarInputSchema>): Promise<z.infer<typeof ProcessAvatarOutputSchema>> {
    return processAvatarFlow(input);
}

const processAvatarFlow = ai.defineFlow(
  {
    name: 'processAvatarFlow',
    inputSchema: ProcessAvatarInputSchema,
    outputSchema: ProcessAvatarOutputSchema,
  },
  async ({ tempStoragePath, tempDownloadURL }) => {
    
    // Extract userId from path like `temp_avatars/USER_ID/filename.jpg`
    const userId = tempStoragePath.split('/')[1];
    if (!userId) {
        throw new Error('Could not determine user ID from storage path.');
    }
    
    // 1. Download the image from the temporary URL
    const imageResponse = await fetch(tempDownloadURL);
    if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // 2. Process the image using sharp
    const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
        .resize(128, 128, { fit: 'cover' }) // Crop to a 128x128 square
        .jpeg({ quality: 90 }) // Convert to JPEG with good quality
        .toBuffer();

    // 3. Upload the processed image to the permanent location
    const finalPath = `avatars/${userId}.jpg`;
    const finalStorageRef = storageRef(storage, finalPath);
    await uploadBytes(finalStorageRef, processedImageBuffer, { contentType: 'image/jpeg' });
    
    // 4. Get the public download URL for the final image
    const finalDownloadURL = await getDownloadURL(finalStorageRef);
    
    // 5. Clean up the temporary file
    const tempFileRef = storageRef(storage, tempStoragePath);
    await deleteObject(tempFileRef).catch(err => console.error("Failed to delete temp file:", err));

    // 6. Return the permanent URL
    return finalDownloadURL;
  }
);
