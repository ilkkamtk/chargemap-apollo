import LevelType from '../models/levelType.js';

export default {
  Query: {
    currenttypes: async () => LevelType.find()
  },
};