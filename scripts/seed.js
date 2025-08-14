import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Log from '../src/models/Log.js'; // <-- default import

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('Missing MONGODB_URI in .env');
  process.exit(1);
}

// lightweight faker to avoid huge deps
const interfaces = ['EmpMaster', 'PayReplication', 'TimeOffSync', 'OrgUnitDelta', 'CompChangePush', 'UserProvision'];
const targets = ['SAP ECP', 'Workday', '3rdParty Payroll', 'Data Lake'];
const sources = ['SAP SF', 'API GW', 'Batch Job'];
const statuses = ['SUCCESS', 'FAILURE', 'PENDING'];
const severities = ['LOW', 'MEDIUM', 'HIGH'];

function randomMessage() {
  const msgs = [
    'Processed successfully.',
    'Network timeout to target.',
    'Mapping error on field lastName.',
    'Authentication token expired.',
    'Partial success; 3 records skipped.',
    'HTTP 500 from downstream.'
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

function randomItem(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

async function run() {
  await mongoose.connect(uri);
  console.log('Connected. Seeding...');

  const TOTAL = Number(process.env.SEED_COUNT || 100000); // change to 500000 if you want
  const BATCH = 5000;

  const now = Date.now();
  let toInsert = [];
  for (let i = 0; i < TOTAL; i++) {
    const createdAt = new Date(now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // last 30 days
    const status = randomItem(statuses);
    const doc = {
      interfaceName: randomItem(interfaces),
      integrationKey: 'INT-' + Math.floor(100000 + Math.random() * 900000),
      status,
      severity: status === 'FAILURE' ? randomItem(['MEDIUM','HIGH']) : randomItem(severities),
      message: randomMessage(),
      meta: { source: randomItem(sources), target: randomItem(targets) },
      createdAt
    };
    toInsert.push(doc);

    if (toInsert.length >= BATCH) {
      await Log.insertMany(toInsert, { ordered: false });
      toInsert = [];
      process.stdout.write('.');
    }
  }
  if (toInsert.length) {
    await Log.insertMany(toInsert, { ordered: false });
  }

  // helpful indexes (in case not built yet)
  await Log.syncIndexes();

  console.log('\nDone!');
  await mongoose.disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
