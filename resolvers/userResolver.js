import User from '../models/user.js';
import {AuthenticationError} from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default {
  Query: {
    user: async (parent, args, {me}) => {
      console.log(me);
      if (!me) {
        throw new AuthenticationError('You are not authenticated');
      }
      return await User.findById({_id: me.id}).exec();
    },
    login: async (parent, {username, password}) => {
      const user = await User.findOne({username});

      console.log(user);

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const matchPasswords = bcrypt.compareSync(password, user.password);

      if (!matchPasswords) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = jwt.sign({id: user.id}, 'riddlemethis',
          {expiresIn: 24 * 10 * 50});
      delete user.password;
      user.token = token;

      return user;
    },
  },
};