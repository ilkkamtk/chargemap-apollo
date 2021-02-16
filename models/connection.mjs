import mongoose from 'mongoose';
import ConnectionType from './ConnectionType.mjs';
import Level from './Level.mjs';
import CurrentType from './CurrentType.mjs';

const Schema = mongoose.Schema;

const connectionSchema = new Schema({
  ConnectionTypeID : {type: mongoose.Types.ObjectId, ref: 'ConnectionType'},
  LevelID: {type: mongoose.Types.ObjectId, ref: 'Level'},
  CurrentTypeID : {type: mongoose.Types.ObjectId, ref: 'CurrentType'},
  Quantity : Number,
});

export default mongoose.model('Connection', connectionSchema);
