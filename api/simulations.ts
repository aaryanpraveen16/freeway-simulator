import { MongoClient } from 'mongodb';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySession } from './lib/clerk.js';

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
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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

    if (req.method === 'GET') {
        try {
            // Parse pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            // Visibility filter
            let query: any = {};
            if (!session.isAdmin) {
                query.$or = [
                    { createdBy: session.userId }, // Own simulations
                    { createdBy: { $exists: false } }, // Legacy simulations
                    { createdBy: null }
                ];
            }

            // Get total count for pagination metadata
            const total = await collection.countDocuments(query);

            // Fetch paginated simulations with index-optimized sort
            const simulations = await collection
                .find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            // Return with pagination metadata
            res.status(200).json({
                simulations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: skip + simulations.length < total
                }
            });
        } catch (error) {
            console.error('GET error:', error);
            res.status(500).json({ error: 'Failed to fetch simulations' });
        }
    } else if (req.method === 'POST') {
        try {
            const simulation = req.body;
            // Ensure ID is present
            if (!simulation.id) {
                simulation.id = `simulation-${Date.now()}`;
            }

            // Add owner information
            simulation.createdBy = session.userId;
            simulation.creatorName = session.fullName;

            console.log('Saving simulation:', simulation.id, 'for user:', session.userId);
            await collection.insertOne(simulation);
            res.status(201).json({ message: 'Simulation saved successfully', id: simulation.id });
        } catch (error) {
            console.error('POST error:', error);
            res.status(500).json({ error: 'Failed to save simulation' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const { ids } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                res.status(400).json({ error: 'Valid simulation IDs are required' });
                return;
            }

            // Visibility filter: only what the user owns OR all if admin
            let query: any = { id: { $in: ids } };
            if (!session.isAdmin) {
                query.createdBy = session.userId;
            }

            const result = await collection.deleteMany(query);

            res.status(200).json({
                message: `Successfully deleted ${result.deletedCount} simulation(s)`,
                deletedCount: result.deletedCount
            });
        } catch (error) {
            console.error('DELETE error:', error);
            res.status(500).json({ error: 'Failed to delete simulations' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
