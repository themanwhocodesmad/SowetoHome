import dns from 'node:dns';
import mongoose from 'mongoose';

// A `mongodb+srv://` URI (what Atlas gives you) requires resolving a DNS SRV record
// before mongoose can even open a socket. On this machine the OS-configured resolver
// Node picks up by default refuses those lookups (ECONNREFUSED on the SRV query) even
// though the network itself is fine - `nslookup` against 8.8.8.8 resolves it instantly.
// Pointing Node's resolver at public DNS sidesteps whatever's wrong with the local one,
// for every DNS lookup this process makes (Mongo SRV/TXT, Redis hostname, etc.), not
// just this one connection.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Takes the Mongo URI as a parameter rather than reading env itself, so this package
// stays agnostic of which app (api or worker) is loading it and how that app manages config.
export async function connectDb(mongoUri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
