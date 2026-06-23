import connectDB from '../lib/mongodb';

export default async function Home() {
  await connectDB();   // This will trigger the connection

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">🎉 BOOPbase</h1>
        <p className="text-2xl">Your Custom NFC Linktree is Ready!</p>
        <p className="mt-6 text-green-400">✅ Connected to MongoDB Successfully</p>
        
        <div className="mt-12">
          <p className="text-sm opacity-70">Next Step: Building User Registration</p>
        </div>
      </div>
    </div>
  );
}
