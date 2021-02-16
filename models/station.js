// https://docs.mongodb.com/manual/core/2dsphere/

import mongoose from 'mongoose';
import Connection from './connection.js';

const Schema = mongoose.Schema;

const stationSchema = new Schema({
  Connections: [{type: mongoose.Types.ObjectId, ref: 'Connection'}],
  Title: String,
  AddressLine1: String,
  Town: String,
  StateOrProvince: String,
  Postcode: String,
  Location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
      // index: { type: '2dsphere', sparse: false },
    },
  },
});

export default mongoose.model('Station', stationSchema);
