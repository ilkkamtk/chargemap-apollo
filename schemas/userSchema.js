import {gql} from 'apollo-server-express';

export default gql`
  extend type Query {
    user: User
  }
  
  type User {
    id: ID
    username: String,
    full_name: String,
    token: String
  }
`;