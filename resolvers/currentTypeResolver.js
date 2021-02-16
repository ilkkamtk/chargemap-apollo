import CurrentType from '../models/currentType.js';

export default {
  Query: {
    currenttypes: async () => CurrentType.find()
  },
};