import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8']);
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const cats = await db.collection('examcategories').find({ name: /ISRO/i }).toArray();
  if (cats.length === 0) {
    console.log('No ISRO category found');
    const all = await db.collection('examcategories').find({}).toArray();
    console.log('All categories:', all.map((c: any) => ({ name: c.name, _id: c._id, slug: c.slug })));
  } else {
    for (const c of cats) {
      console.log(`ISRO Category: name="${c.name}", _id="${c._id}", slug="${c.slug}"`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
