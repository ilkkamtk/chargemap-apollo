import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const currentTypeSchema = new Schema({
  Description : String,
  Title : String
});

export default mongoose.model('CurrentType', currentTypeSchema);
