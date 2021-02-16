import dotenv from 'dotenv';
import express from 'express';
import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import connectMongo from './db/db.js';
import schemas from './schemas/index.js';
import resolvers from './resolvers/index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

dotenv.config();

const getUser = async (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      return await jwt.verify(token, 'riddlemethis');
    } catch (e) {
      throw new AuthenticationError('Your session expired. Sign in again.');
    }
  }
};

const startServer = async () => {
  try {
    const conn = await connectMongo();
    if (conn) {
      console.log('Connected successfully.');
    }

    const server = new ApolloServer({
      typeDefs: schemas,
      resolvers,
      context: async ({req}) => {
        if (req) {
          const me = await getUser(req);
          return {
            me,
          };
        }
      },
    });

    const app = express();
    app.use(express.static('public'));
    app.use('/modules', express.static('node_modules'));

    server.applyMiddleware({app});

    app.listen({port: 3000}, () =>
        console.log(
            `🚀 Server ready at http://localhost:3000${server.graphqlPath}`),
    );
  } catch (e) {
    console.log('server error: ' + e.message);
  }
};
startServer();
