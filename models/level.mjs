import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const levelSchema = new Schema({
  Comments: String,
  IsFastChargeCapable: Boolean,
  Title: String,
});

export default mongoose.model('Level', levelSchema);
