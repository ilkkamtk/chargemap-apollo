import Connection from '../models/connection.js';

export default {
  Query: {
    connections: async () => Connection.find()
  },
};