import Station from '../models/station.js';
import Connection from '../models/connection.js';
import {AuthenticationError} from 'apollo-server-express';
import {rectangleBounds} from '../utils/rectangleBounds.js';

export default {
  Query: {
    stations: (parent, args, context, info) => {
      const mapBounds = rectangleBounds(args.bounds._northEast,
          args.bounds._southWest);
      return Station.find(({
        Location: {
          $geoWithin: {  // geoWithin is built in mongoose, https://mongoosejs.com/docs/geojson.html
            $geometry: mapBounds,
          },
        },
      })).populate({
        path: 'Connections',
        populate: {
          path: 'ConnectionTypeID LevelID CurrentTypeID',
        },
      });
    },
  },
  Mutation: {
    addStation: async (parent, args, { me }, info) => {
      if (!me) {
        throw new AuthenticationError('You are not authenticated');
      }
      const conns = await Promise.all(args.Connections.map(async conn => {
        let newConnection = new Connection(conn);
        const result = await newConnection.save();
        return result._id;
      }));

      let newStation = new Station({
        ...args,
        Connections: conns,
      });
      return newStation.save();
    },
  },
};