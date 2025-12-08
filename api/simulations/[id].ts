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
            res.status(200).json(simulation);
        } catch (error) {
            console.error('GET error:', error);
            res.status(500).json({ error: 'Failed to fetch simulation' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const result = await collection.deleteOne({ id });
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
            const updateData = req.body;
            const result = await collection.updateOne(
                { id },
                { $set: updateData }
            );
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
        res.setHeader('Allow', ['GET', 'DELETE', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
