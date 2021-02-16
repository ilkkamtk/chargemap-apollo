import Station from '../models/station.mjs';
import Connection from '../models/connection.mjs';
import ConnectionType from '../models/connectionType.mjs';
import CurrentType from '../models/currentType.mjs';
import LevelType from '../models/level.mjs';
import User from '../models/user.mjs';
import {rectangleBounds} from '../utils/rectangleBounds.js';

export const resolvers = {
  Query: {
    stations: async (parent, args, context, info) => {
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
    connectiontypes: async () => ConnectionType.find(),
    leveltypes: async () => LevelType.find(),
    currenttypes: async () => CurrentType.find(),
  },
};