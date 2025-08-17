
'use server';
/**
 * @fileOverview A flow for uploading files to Firebase Storage.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getStorage } from 'firebase-admin/storage';

// Ensure you have initialized firebase-admin in your project for this to work.
// This is typically done in a central file that runs on server startup.

const UploadFileInputSchema = z.object({
  fileDataUrl: z.string().describe('The file encoded as a data URL.'),
  path: z.string().describe('The path in Firebase Storage to upload the file to.'),
  contentType: z.string().describe('The MIME type of the file.'),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

const UploadFileOutputSchema = z.object({
  downloadURL: z.string().url().describe('The public URL of the uploaded file.'),
});
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    return uploadFileFlow(input);
}


const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async (input) => {
    const { fileDataUrl, path, contentType } = input;

    const bucket = getStorage().bucket();
    const file = bucket.file(path);

    // Extract the Base64 part of the data URL
    const base64EncodedString = fileDataUrl.split(',')[1];
    if (!base64EncodedString) {
        throw new Error('Invalid data URL format.');
    }

    const buffer = Buffer.from(base64EncodedString, 'base64');

    await file.save(buffer, {
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });
    
    // Make the file public to get a download URL
    await file.makePublic();

    const downloadURL = file.publicUrl();

    return { downloadURL };
  }
);
