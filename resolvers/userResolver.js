import User from '../models/user.js';
import {AuthenticationError} from 'apollo-server-express';
import {login} from '../utils/auth.js';

export default {
  Query: {
    user: async (parent, args, {user}) => {
      console.log('userResolver', user);
      if (!user) {
        throw new AuthenticationError('You are not authenticated');
      }
      return await User.findById({_id: user.id}).exec();
    },
    login: async (parent, args, {req, res}) => {
      req.body = args; // inject args to reqest body for passport
      try {
        const authResponse = await login(req, res);
        console.log('ar', authResponse);
        return {
          id: authResponse.user._id,
          ...authResponse.user,
          token: authResponse.token,
        };
      } catch (e) {
        throw new AuthenticationError('Invalid credentials');
      }
    },
  },
};