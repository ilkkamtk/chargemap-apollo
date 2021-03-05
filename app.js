import dotenv from 'dotenv';
import express from 'express';
import {ApolloServer, AuthenticationError} from 'apollo-server-express';
import connectMongo from './db/db.js';
import schemas from './schemas/index.js';
import resolvers from './resolvers/index.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import {checkAuth} from './utils/auth.js';

dotenv.config();

const startServer = async () => {
  try {
    const conn = await connectMongo();
    if (conn) {
      console.log('Connected successfully.');
    }

    const server = new ApolloServer({
      typeDefs: schemas,
      resolvers,
      context: async ({req, res}) => {
        if (req) {
          const user = await checkAuth(req, res);
          console.log('app', user);
          return {
            req,
            res,
            user,
          };
        }
      },
    });

    const app = express();
    app.use(cors());
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
