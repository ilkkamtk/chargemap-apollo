import dotenv from 'dotenv';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import connectMongo from './db/db.mjs';
import {typeDefs} from './graphql/typeDefs.mjs';
import {resolvers} from './graphql/resolvers.mjs';
import Station from './models/station.mjs';

dotenv.config();

const startServer = async () => {
  try {
    const conn = await connectMongo();
    /*if (conn) {
      console.log('Connected successfully.');
      const stations = await Station.find().populate({
        path: 'Connections',
        populate: {
          path: 'ConnectionTypeID LevelID CurrentTypeID'
        }
      })
      console.log(stations[0].Connections[0]);
    }*/

    const server = new ApolloServer({
      typeDefs,
      resolvers,
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
