require('dotenv').config();
const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: String,
  temperament: String,
  description: String,
  image: String,
  cost: Number,
});
const Pet = mongoose.model('Pet', petSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await Pet.deleteMany({});

  await Pet.insertMany([
    {
      name: "Buddy",
      type: "Dog",
      size: "Medium",
      temperament: "Playful",
      description: "A friendly dog who loves to play fetch.",
      image: "https://placedog.net/400/300?id=1",
      cost: 15000
    },
    {
      name: "Whiskers",
      type: "Cat",
      size: "Small",
      temperament: "Calm",
      description: "A calm cat who enjoys cuddles.",
      image: "https://loremflickr.com/400/300/kitten",
      cost: 8000
    }
  ]);

  console.log("Pets seeded.");
  mongoose.disconnect();
}

seed();
