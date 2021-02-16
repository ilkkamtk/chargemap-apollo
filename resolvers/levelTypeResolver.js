import LevelType from '../models/levelType.js';

export default {
  Query: {
    leveltypes: async () => LevelType.find()
  },
};