import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    stations(bounds: Bounds, limit: Int, start: Int): [Station]
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