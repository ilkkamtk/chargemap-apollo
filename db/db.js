import mongoose from 'mongoose';

// mongoose.Promise = Promise;

// mongoose.set('useFindAndModify', false);

const connectMongo = async () => {
  try {
    const connection = await mongoose.connect(process.env.DB_URL,
        {
          useNewUrlParser: true,
          useFindAndModify: false,
          useCreateIndex: true,
          useUnifiedTopology: true,
        });
    return connection;
  } catch (e) {
    console.log('Connection to db failed: ' + e);
  }
};

export default connectMongo;
