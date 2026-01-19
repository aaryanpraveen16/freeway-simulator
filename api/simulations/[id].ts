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
    res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PUT,OPTIONS');
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
    const { id } = req.query;

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

            // Permission check: owner, admin, or legacy
            const isOwner = simulation.createdBy === session.userId;
            const isLegacy = !simulation.createdBy;

            if (!isOwner && !session.isAdmin && !isLegacy) {
                res.status(403).json({ error: 'Forbidden: You do not have permission to view this simulation' });
                return;
            }

            res.status(200).json(simulation);
        } catch (error) {
            console.error('GET error:', error);
            res.status(500).json({ error: 'Failed to fetch simulation' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const simulation = await collection.findOne({ id });
            if (!simulation) {
                res.status(404).json({ error: 'Simulation not found' });
                return;
            }

            // Only owner or admin can delete
            if (simulation.createdBy !== session.userId && !session.isAdmin) {
                res.status(403).json({ error: 'Forbidden: You do not have permission to delete this simulation' });
                return;
            }

            const result = await collection.deleteOne({ id });
            res.status(200).json({ message: 'Simulation deleted successfully' });
        } catch (error) {
            console.error('DELETE error:', error);
            res.status(500).json({ error: 'Failed to delete simulation' });
        }
    } else if (req.method === 'PUT') {
        try {
            const simulation = await collection.findOne({ id });
            if (!simulation) {
                res.status(404).json({ error: 'Simulation not found' });
                return;
            }

            // Only owner or admin can update
            if (simulation.createdBy !== session.userId && !session.isAdmin) {
                res.status(403).json({ error: 'Forbidden: You do not have permission to update this simulation' });
                return;
            }

            const updateData = req.body;
            // Remove immutable fields
            const { _id, id: bodyId, createdBy, creatorName, ...safeUpdateData } = updateData;

            const result = await collection.updateOne(
                { id },
                { $set: safeUpdateData }
            );
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

