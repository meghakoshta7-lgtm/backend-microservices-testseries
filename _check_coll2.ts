import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const cnt = await db.collection(c.name).countDocuments();
    if (cnt > 0) console.log(`${c.name}: ${cnt}`);
  }

  // Check if categories might be under a different collection
  const allColls = await db.listCollections().toArray();
  for (const c of allColls) {
    if (c.name.toLowerCase().includes('categor') || c.name.toLowerCase().includes('exam')) {
      const docs = await db.collection(c.name).find({}).limit(2).toArray();
      console.log(`\n${c.name}:`, JSON.stringify(docs, null, 2).substring(0, 500));
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
