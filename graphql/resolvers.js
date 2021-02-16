import Station from '../models/station.js';
import Connection from '../models/connection.js';
import ConnectionType from '../models/connectionType.js';
import CurrentType from '../models/currentType.js';
import LevelType from '../models/level.js';
import User from '../models/user.js';
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