import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    connectiontypes: [ConnectionType]
  }
  
  type ConnectionType {
    id: ID
    FormalName: String
    Title: String
  }
`;