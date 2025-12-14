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
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db('traffic-simulator');
    const collection = db.collection('simulations');
    const { id } = req.query;
    console.log('[DEBUG] Request URL:', req.url);
    console.log('[DEBUG] Request Query:', JSON.stringify(req.query));
    console.log('[DEBUG] Raw ID:', id, 'Type:', typeof id);

    if (typeof id !== 'string') {
        res.status(400).json({ error: 'Invalid ID' });
        return;
    }

    if (req.method === 'GET') {
        try {
            const simulation = await collection.findOne({ id });
            if (!simulation) {
                res.status(404).json({ error: 'Simulation not found' });
                return;
            }
            res.status(200).json(simulation);
        } catch (error) {
            console.error('GET error:', error);
            res.status(500).json({ error: 'Failed to fetch simulation' });
        }
    } else if (req.method === 'DELETE') {
        try {
            console.log('DELETE request for simulation:', id);
            const result = await collection.deleteOne({ id });
            console.log('Delete result:', result);
            if (result.deletedCount === 0) {
                res.status(404).json({ error: 'Simulation not found' });
                return;
            }
            res.status(200).json({ message: 'Simulation deleted successfully' });
        } catch (error) {
            console.error('DELETE error:', error);
            res.status(500).json({ error: 'Failed to delete simulation' });
        }
    } else if (req.method === 'PUT') {
        try {
            console.log('PUT request for simulation:', id);
            const updateData = req.body;
            console.log('Update data:', updateData);

            // Remove _id from update data as it's immutable
            const { _id, ...safeUpdateData } = updateData;

            const result = await collection.updateOne(
                { id },
                { $set: safeUpdateData }
            );
            console.log('Update result:', result);
            if (result.matchedCount === 0) {
                res.status(404).json({ error: 'Simulation not found' });
                return;
            }
            res.status(200).json({ message: 'Simulation updated successfully' });
        } catch (error) {
            console.error('PUT error:', error);
            res.status(500).json({ error: 'Failed to update simulation' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'DELETE', 'PUT', 'OPTIONS']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

