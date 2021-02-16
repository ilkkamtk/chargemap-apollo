import Station from '../models/station.mjs';
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
          path: 'ConnectionTypeID LevelID CurrentTypeID'
        }
      });
    }
  },
};