import Station from '../models/station.js';
import Connection from '../models/connection.js';
import {AuthenticationError} from 'apollo-server-express';
import {rectangleBounds} from '../utils/rectangleBounds.js';

export default {
  Query: {
    station: (parent, args) => {
      return Station.findById(args.id).populate({
        path: 'Connections',
        populate: {
          path: 'ConnectionTypeID LevelID CurrentTypeID',
        },
      });
    },
    stations: (parent, args, context, info) => {
      if (args.bounds) { // if bounds arg is in query
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
      } else {
        return Station.find().skip(args.start).limit(args.limit).populate({
          path: 'Connections',
          populate: {
            path: 'ConnectionTypeID LevelID CurrentTypeID',
          },
        });
      }
    },
  },
  Mutation: {
    addStation: async (parent, args, {user}, info) => {
      if (!user) {
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
    modifyStation: async (parent, args, {user}, info) => {
      try {
        if (!user) {
          throw new AuthenticationError('You are not authenticated');
        }
        await Promise.all(args.Connections.map(async conn => {
          return Connection.findByIdAndUpdate(conn.id, conn,
              {new: true});
        }));
        let newStation = {
          Title: args.Title,
          AddressLine1: args.AddressLine1,
          Town: args.Town,
          StateOrProvince: args.StateOrProvince,
          Postcode: args.Postcode,
        };
        return await Station.findByIdAndUpdate(args.id, newStation,
            {new: true});
      } catch (err) {
        throw new Error(err);
      }
    },
    deleteStation: async (parent, args, {user}, info) => {
      try {
        if (!user) {
          throw new AuthenticationError('You are not authenticated');
        }
        // delete connections
        const stat = await Station.findById(args.id);
        const delResult = await Promise.all(
            stat.Connections.map(async (conn) => {
              return Connection.findByIdAndDelete(conn._id);
            }));
        console.log('delete result', delResult);
        const result = await Station.findByIdAndDelete(args.id);
        console.log('delete result', result);
        return result;
      } catch (err) {
        throw new Error(err);
      }
    },
  },
};