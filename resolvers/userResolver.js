import User from '../models/user.js';

export default {
  Query: {
    user: async () => User.find()
  },
};