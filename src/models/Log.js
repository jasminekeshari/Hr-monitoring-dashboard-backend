import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  interfaceName: { type: String, required: true },
  integrationKey: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILURE', 'PENDING'], required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  message: { type: String },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

const Log = mongoose.model('Log', LogSchema);
export default Log;
