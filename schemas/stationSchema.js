import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    station(id: ID): Station
    stations(bounds: Bounds, limit: Int, start: Int): [Station]
  }
  
  extend type Mutation {
    addStation(
      Connections: [ConnectionInput]
      Title: String
      AddressLine1: String
      Town: String
      StateOrProvince: String
      Postcode: String
      Location: PointObjectInput
    ): Station
    
    modifyStation(
        id: ID
        Connections: [ConnectionInput]
        Title: String
        AddressLine1: String
        Town: String
        StateOrProvince: String
        Postcode: String
      ): Station
      
    deleteStation(id: ID): Station
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
    type: String
  }
  
  input PointObjectInput {
    coordinates: [Float]
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