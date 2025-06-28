import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6857024e751feb3df08ed930", 
  requiresAuth: true // Ensure authentication is required for all operations
});
