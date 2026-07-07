import mongoose from 'mongoose';

// Takes the Mongo URI as a parameter rather than reading env itself, so this package
// stays agnostic of which app (api or worker) is loading it and how that app manages config.
export async function connectDb(mongoUri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
