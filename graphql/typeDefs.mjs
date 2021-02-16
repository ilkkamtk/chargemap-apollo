import {gql} from 'apollo-server-express';

export const typeDefs = gql`
  type Query {
    stations(bounds: Bounds, limit: Int = 10, start: Int): [Station]
  }

  type Station {
    id: ID
    Connections: [Connection]
    Title: String
    AddressLine1: String
    Town: String
    StateOrProvince: String
    Postcode: String
    Location: PointObject
  }
  
  type Connection {
    id: ID
    Quantity: Int
    ConnectionTypeID: ConnectionType
    LevelID: LevelType,
    CurrentTypeID: CurrentType,
  } 
  
  type ConnectionType {
    id: ID
    FormalName: String
    Title: String
  }
  
  type CurrentType {
    id: ID
    Description: String
    Title: String
  }
  
  type LevelType {
    id: ID
    Comments: String
    IsFastChargeCapable: Boolean
    Title: String
  }
  
  type User {
    id: ID
    username: String,
    full_name: String,
    token: String
  }
  
  type PointObject {
    coordinates: [Float]
    type: forcePoint
  }
  
  enum forcePoint {
    Point
  }
  
  input Bounds {
    _southWest: LatLng
    _northEast: LatLng
  }
  
  input LatLng {
     lat: Float
     lng: Float
  }
`;