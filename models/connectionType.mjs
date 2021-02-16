import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const connectionTypeSchema = new Schema({
  FormalName : String,
  Title : String
});

export default mongoose.model('ConnectionType', connectionTypeSchema);
