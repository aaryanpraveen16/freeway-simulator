import { MongoClient } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySession } from '../lib/clerk.js';

// MongoDB connection setup
if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Verify session
    const session = await verifySession(req);
    if (!session) {
        res.status(401).json({ error: 'Unauthorized: Please log in' });
        return;
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('traffic-simulator');
    const collection = db.collection('simulations');

    // Extract folder name from URL path (for DELETE)
    const pathParts = (req.url || '').split('/');
    const folderName = pathParts[pathParts.length - 1];

    if (req.method === 'PUT') {
        // Rename folder
        try {
            const { oldName, newName } = req.body;

            if (!oldName || !newName) {
                res.status(400).json({ error: 'Both oldName and newName are required' });
                return;
            }

            // Only update simulations owned by the user (or all if admin)
            const query: any = { folder: oldName };
            if (!session.isAdmin) {
                query.createdBy = session.userId;
            }

            const result = await collection.updateMany(
                query,
                { $set: { folder: newName } }
            );

            res.status(200).json({
                message: 'Folder renamed successfully',
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            console.error('PUT error:', error);
            res.status(500).json({ error: 'Failed to rename folder' });
        }
    } else if (req.method === 'DELETE') {
        // Delete folder (move simulations to uncategorized OR delete them all)
        try {
            const folderName = req.query.folderName as string;
            const deleteAll = req.query.deleteAll === 'true';

            if (!folderName) {
                res.status(400).json({ error: 'Folder name is required' });
                return;
            }

            const decodedFolderName = decodeURIComponent(folderName);

            // Visibility filter: own simulations OR legacy simulations OR all if admin
            let query: any = { folder: decodedFolderName };
            if (!session.isAdmin) {
                query.$or = [
                    { createdBy: session.userId },
                    { createdBy: { $exists: false } },
                    { createdBy: null }
                ];
            }

            let result;
            if (deleteAll) {
                result = await collection.deleteMany(query);
            } else {
                result = await collection.updateMany(
                    query,
                    { $unset: { folder: "" } }
                );
            }

            res.status(200).json({
                message: deleteAll ? 'Folder and all simulations deleted' : 'Folder deleted successfully',
                modifiedCount: deleteAll ? result.deletedCount : result.modifiedCount,
                deleted: deleteAll
            });
        } catch (error) {
            console.error('DELETE error:', error);
            res.status(500).json({ error: 'Failed to delete folder' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
