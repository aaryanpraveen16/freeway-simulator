import { MongoClient } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';

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
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('traffic-simulator');
    const collection = db.collection('simulations');

    // Extract folder name from URL path
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

            // Update all simulations with the old folder name to the new folder name
            const result = await collection.updateMany(
                { folder: oldName },
                { $set: { folder: newName } }
            );

            console.log(`Renamed folder "${oldName}" to "${newName}". Updated ${result.modifiedCount} simulations.`);

            res.status(200).json({
                message: 'Folder renamed successfully',
                modifiedCount: result.modifiedCount
            });
        } catch (error) {
            console.error('PUT error:', error);
            res.status(500).json({ error: 'Failed to rename folder' });
        }
    } else if (req.method === 'DELETE') {
        // Delete folder (move simulations to uncategorized)
        try {
            if (!folderName) {
                res.status(400).json({ error: 'Folder name is required' });
                return;
            }

            // Decode the folder name from URL
            const decodedFolderName = decodeURIComponent(folderName);

            // Update all simulations in this folder to have no folder (uncategorized)
            const result = await collection.updateMany(
                { folder: decodedFolderName },
                { $unset: { folder: "" } }
            );

            console.log(`Deleted folder "${decodedFolderName}". Moved ${result.modifiedCount} simulations to uncategorized.`);

            res.status(200).json({
                message: 'Folder deleted successfully',
                modifiedCount: result.modifiedCount
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
