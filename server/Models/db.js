const mongoose=require('mongoose');
console.log("MONGO_URI =", process.env.MONGO_URI);
const mongo_url=process.env.MONGO_URI;
console.log(mongo_url);


mongoose.connect(mongo_url)
  .then(async () => {
      console.log("✅ Connected to MongoDB Analytics Database!");
  })
  .catch(err => console.error(" MongoDB connection error:", err));

