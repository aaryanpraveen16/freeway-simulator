import { createClerkClient, verifyToken } from '@clerk/backend';
import { VercelRequest } from '@vercel/node';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function verifySession(req: VercelRequest) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
    try {
        // In @clerk/backend 2.x, verifyToken is imported directly
        // Ensure we have a secret key
        if (!process.env.CLERK_SECRET_KEY) {
            console.error('CLERK_SECRET_KEY is missing in backend environment');
            return null;
        }

        const session = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY
        });
        const userId = session.sub;

        if (!userId) {
            console.warn('Clerk token verified but "sub" (userId) is missing');
            return null;
        }

        // Fetch user details to check for roles
        const user = await clerkClient.users.getUser(userId);
        if (!user) {
            console.error('Clerk user not found for ID:', userId);
            return null;
        }

        const isAdmin = user.publicMetadata?.role === 'admin' || user.publicMetadata?.isAdmin === true;

        return {
            userId,
            isAdmin,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous'
        };
    } catch (error) {
        console.error('Clerk verification failed for token:', token.substring(0, 10) + '...', error);
        return null;
    }
}
