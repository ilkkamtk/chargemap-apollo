import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    connection(id:ID): [Connection]
  }
  
  type Connection {
    id: ID
    Quantity: Int
    ConnectionTypeID: ConnectionType
    LevelID: LevelType,
    CurrentTypeID: CurrentType,
  } 
  
`;