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

    if (req.method === 'GET') {
        try {
            const simulations = await collection.find({}).sort({ timestamp: -1 }).toArray();
            res.status(200).json(simulations);
        } catch (error) {
            console.error('GET error:', error);
            res.status(500).json({ error: 'Failed to fetch simulations' });
        }
    } else if (req.method === 'POST') {
        try {
            const simulation = req.body;
            // Ensure ID is present, or generate one if needed (though frontend usually provides it)
            if (!simulation.id) {
                simulation.id = `simulation-${Date.now()}`;
            }

            await collection.insertOne(simulation);
            res.status(201).json({ message: 'Simulation saved successfully', id: simulation.id });
        } catch (error) {
            console.error('POST error:', error);
            res.status(500).json({ error: 'Failed to save simulation' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
