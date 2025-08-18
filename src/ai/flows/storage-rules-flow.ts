'use server';
/**
 * @fileOverview A flow for setting Firebase Storage security rules.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// This is a simplified representation of the Storage rules.
// In a real scenario, you might have a more complex structure.
const StorageRulesSchema = z.object({
  rules: z.string().describe('The content of the storage.rules file.'),
});

// We are not defining an exported function for this flow as it's for internal use.
// This flow is intended to be called directly by the AI to set the rules.

const setStorageRulesFlow = ai.defineFlow(
  {
    name: 'setStorageRulesFlow',
    inputSchema: StorageRulesSchema,
    outputSchema: z.object({ success: z.boolean() }),
  },
  async (input) => {
    // In a real implementation, this would use the Firebase Admin SDK
    // to deploy the storage rules to the user's project.
    // e.g., admin.storage().setRules(input.rules);
    console.log('Applying new storage rules:', input.rules);
    
    // For this prototype, we will just log the action and return success.
    // The actual application of rules must be done by the developer in the Firebase Console
    // or via a secure backend environment.
    return { success: true };
  }
);

// Immediately call the flow with the correct rules for this application.
// This is a self-executing setup step.
(async () => {
  const secureRules = `
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access to all files
    match /{allPaths=**} {
      allow read;
    }
    
    // Allow authenticated users to write to their own avatar path
    match /avatars/{userId} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
`;
  try {
    await setStorageRulesFlow({ rules: secureRules });
    console.log('Successfully prepared storage security rules.');
  } catch (error) {
    console.error('Failed to set storage security rules:', error);
  }
})();
