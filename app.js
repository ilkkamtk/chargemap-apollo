import dotenv from 'dotenv';
import connectMongo from './db/db.js';
import {ApolloServer} from 'apollo-server-express';
import schemas from './schemas/index.js';
import resolvers from './resolvers/index.js';
import {checkAuth} from './utils/auth.js';
import express from 'express';
import cors from 'cors';

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

    return server;
  } catch (e) {
    console.log('server error: ' + e.message);
  }
};

startServer();