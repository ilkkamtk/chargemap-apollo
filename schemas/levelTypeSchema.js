import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    leveltypes: [LevelType]
  }
  
  type LevelType {
    id: ID
    Comments: String
    IsFastChargeCapable: Boolean
    Title: String
  }
`;