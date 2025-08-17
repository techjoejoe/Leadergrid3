
'use server';

/**
 * @fileOverview A server-side flow to process user-uploaded avatars.
 * This flow takes a temporary image URL, resizes and crops it to a 128x128
 * square, saves it to a permanent location, and cleans up the temporary file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import sharp from 'sharp';
import { PassThrough } from 'stream';

const ProcessAvatarInputSchema = z.object({
  tempPath: z.string().describe('The temporary path in Firebase Storage of the uploaded image.'),
  tempUrl: z.string().url().describe('The temporary public URL of the uploaded image.'),
  userId: z.string().describe('The ID of the user who owns the avatar.'),
});
export type ProcessAvatarInput = z.infer<typeof ProcessAvatarInputSchema>;

const ProcessAvatarOutputSchema = z.object({
  finalUrl: z.string().url().describe('The final, permanent URL of the processed avatar.'),
});
export type ProcessAvatarOutput = z.infer<typeof ProcessAvatarOutputSchema>;

export async function processAvatar(input: ProcessAvatarInput): Promise<ProcessAvatarOutput> {
  return processAvatarFlow(input);
}

const processAvatarFlow = ai.defineFlow(
  {
    name: 'processAvatarFlow',
    inputSchema: ProcessAvatarInputSchema,
    outputSchema: ProcessAvatarOutputSchema,
  },
  async ({ tempPath, tempUrl, userId }) => {
    // 1. Download the temporary image into a buffer
    const response = await fetch(tempUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch temporary image: ${response.statusText}`);
    }
    const imageBuffer = await response.arrayBuffer();

    // 2. Process the image with Sharp
    const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(128, 128, {
        fit: 'cover', // Crop to cover the area, discarding excess
        position: 'entropy', // Focus on the most interesting part of the image
      })
      .jpeg({ quality: 90 }) // Convert to JPEG for good compression
      .toBuffer();

    // 3. Upload the processed image to the final destination
    const finalPath = `avatars/${userId}.jpg`;
    const finalStorageRef = storageRef(storage, finalPath);
    await uploadBytes(finalStorageRef, processedImageBuffer, {
      contentType: 'image/jpeg',
    });
    const finalUrl = await getDownloadURL(finalStorageRef);

    // 4. Clean up the temporary image
    try {
        const tempStorageRef = storageRef(storage, tempPath);
        await deleteObject(tempStorageRef);
    } catch (error) {
        // Log the error but don't fail the flow, as the main goal was achieved.
        console.warn(`Failed to delete temporary avatar at ${tempPath}:`, error);
    }

    // 5. Return the final URL
    return { finalUrl };
  }
);
