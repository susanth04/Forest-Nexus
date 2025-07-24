require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');             
const path = require('path'); 
const Preference = require("./models/Preference"); 


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// === Multer setup for file uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// === Connect to MongoDB ===
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log('MongoDB connected');
  seedUsers();
}).catch(err => console.error(err));

// === Schemas ===
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

const petSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: String,
  temperament: String,
  description: String,
  imageUrl: String,
  maintenanceCost: Number,
  createdAt: { type: Date, default: Date.now },
  isAdopted: { type: Boolean, default: false }

});
const Pet = mongoose.model('Pet', petSchema);

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  petName: String,
  reason: String,
  contact: String,
  status: { type: String, default: 'Pending' },
  estimatedArrival: String,
  deliveryTracking: String,
  createdAt: { type: Date, default: Date.now }
});
const adoptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  estimatedArrival:String,
  deliveryTracking: String,
  adoptedAt: { type: Date, default: Date.now }
});
const Adoption = mongoose.model('Adoption', adoptionSchema);

const Request = mongoose.model('Request', requestSchema);


const userPreferenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // if user logged in
  space: String,
  activity: String,
  salary: Number,
  kids: String,
  otherPets: String,
  timeAvailable: String,
  groomingEffort: String,
  outdoorAccess: String,
  type: String,
  size: String,
  age: String,
  energy: String,
  grooming: String,
  trainability: String,
  temperament: String,
  createdAt: { type: Date, default: Date.now }
});
const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);


// === Auth Middleware ===
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Explicitly assign decoded fields to req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    console.error('JWT Error:', err.message);
    res.status(401).json({ message: 'Invalid token', error: err.message });
  }
};

// === Seed admin/user ===
const seedUsers = async () => {
  const admin = await User.findOne({ email: 'admin@petpair.com' });
  if (!admin) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@petpair.com', password: hash, role: 'admin' });
    console.log('Admin user created');
  }

  const user = await User.findOne({ email: 'user@petpair.com' });
  if (!user) {
    const hash = await bcrypt.hash('user123', 10);
    await User.create({ email: 'user@petpair.com', password: hash, role: 'user' });
    console.log('Regular user created');
  }
};

// === Auth Routes ===
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'User exists' });

  const hash = await bcrypt.hash(password, 10);
  await User.create({ email, password: hash, role: 'user' });  // <-- added role explicitly
  res.status(201).json({ message: 'User created' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Wrong password' });

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token, email: user.email, role: user.role });
});

// === Pet Routes ===
app.post('/api/pets', authMiddleware, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  try {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const petData = {
      name: req.body.name,
      type: req.body.type,
      size: req.body.size,
      temperament: req.body.temperament,
      description: req.body.description,
      maintenanceCost: req.body.maintenanceCost,
      imageUrl
    };

    const pet = await Pet.create(petData);
    res.status(201).json({ pet });
  } catch (err) {
    res.status(500).json({ message: 'Error saving pet', error: err.message });
  }
});

app.get('/api/pets', async (req, res) => {
  const pets = await Pet.find().sort({ createdAt: -1 });

  const host = req.get('host'); 
  const protocol = req.protocol; 

  const petsWithFullUrl = pets.map(pet => ({
    ...pet.toObject(),
    imageUrl: pet.imageUrl ? `${protocol}://${host}${pet.imageUrl}` : null
  }));

  res.json(petsWithFullUrl);
});

app.delete('/api/pets/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });

  try {
    const pet = await Pet.findByIdAndDelete(req.params.id);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });
    res.json({ message: 'Pet deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting pet', error: err.message });
  }
});

// === Admin Check Route ===
app.get('/api/admin', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  res.json({ message: 'Welcome Admin!', email: req.user.email });
});

// === Adoption Request Routes ===
app.post('/api/requests', authMiddleware, async (req, res) => {
  try {
    const { petId, reason, contact } = req.body;
    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ message: 'Pet not found' });

    const request = new Request({
      userId: req.user.id,
      petId,
      petName: pet.name,
      reason,
      contact,
      status: 'Pending'
    });

    await request.save();
    res.json({ message: 'Request submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting request', error: err.message });
  }
});



app.get('/api/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // Also get adoptions for this user
    const adoptions = await Adoption.find({ user: req.user.id });

    const enriched = requests.map(req => {
      const match = adoptions.find(adopt =>
        adopt.user.toString() === req.userId.toString() &&
        adopt.pet.toString() === req.petId.toString()
      );

      return {
        ...req.toObject(),
        estimatedArrival: match?.estimatedArrival|| req.estimatedArrival || 'Pending',
        deliveryTracking: match?.deliveryTracking|| req.deliveryTracking || 'Pending'
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ message: 'Error fetching requests', error: err.message });
  }
});


app.delete('/api/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await Request.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!request) return res.status(404).json({ message: 'Request not found' });

    const petId = request.petId;

    if (request.status === 'Approved') {
      await Adoption.deleteOne({ user: req.user.id, pet: petId });
      await Pet.findByIdAndUpdate(petId, { isAdopted: false });
    }

    await Request.deleteOne({ _id: req.params.id });

    res.json({ message: 'Request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling request', error: err.message });
  }
});

app.patch("/api/requests/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only admins can update requests." });
  }

  const { status, estimatedArrival, deliveryTracking } = req.body;

  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const petId = request.petId;

  
    if (status) request.status = status;
    if (estimatedArrival) request.estimatedArrival = estimatedArrival;
    if (deliveryTracking) request.deliveryTracking = deliveryTracking;

    const updated = await request.save();

   
    if (status === "Approved") {
      await Pet.findByIdAndUpdate(petId, { isAdopted: true });

      let adoption = await Adoption.findOne({
        user: request.userId,
        pet: request.petId,
      });

      if (!adoption) {
        adoption = new Adoption({
          user: request.userId,
          pet: request.petId,
          estimatedArrival,
          deliveryTracking,
        });
      } else {
        if (estimatedArrival) adoption.estimatedArrival = estimatedArrival;
        if (deliveryTracking) adoption.deliveryTracking = deliveryTracking;
      }

      await adoption.save();
      console.log("✅ Adoption created/updated:", adoption);
    }

    res.json({ message: "Request updated successfully", request: updated });
  } catch (err) {
    console.error("❌ PATCH error:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});

app.get('/api/admin/requests', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }

  try {
    const requests = await Request.find().populate('petId userId').sort({ createdAt: -1 });

    const adoptions = await Adoption.find();

    const enriched = requests.map(req => {
      const match = adoptions.find(adopt =>
        adopt.user.toString() === req.userId.toString() &&
        adopt.pet.toString() === req.petId.toString()
      );

      return {
        ...req.toObject(),
        estimatedArrival: match?.estimatedArrival || req.estimatedArrival || 'Pending',
        deliveryTracking: match?.deliveryTracking || req.deliveryTracking || 'Pending',
        userEmail: req.userId.email || '',
        petName: req.petId.name || ''
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('❌ Admin fetching requests failed:', err);
    res.status(500).json({ message: 'Failed to fetch admin requests', error: err.message });
  }
});

app.get('/api/adoptions', authMiddleware, async (req, res) => {
  try {
    const adoptions = await Adoption.find({ user: req.user.id })
      .populate('pet')
      .sort({ createdAt: -1 });

    res.json(adoptions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching adoptions', error: err.message });
  }
});

app.delete('/api/adoptions/:id', authMiddleware, async (req, res) => {
  try {
    const adoption = await Adoption.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!adoption) return res.status(404).json({ message: 'Adoption not found' });

    await Pet.findByIdAndUpdate(adoption.pet, { isAdopted: false });

    await Adoption.deleteOne({ _id: req.params.id });

    await Request.deleteOne({ userId: req.user.id, petId: adoption.pet });

    res.json({ message: 'Adoption cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling adoption', error: err.message });
  }
});

app.post('/api/suggest-pet', async (req, res) => {

  try {
    const prefs = req.body;

    const userId = req.user?.id || null;

    const savedPref = await UserPreference.create({ ...prefs, userId });

    
  const breeds = {
  dog: [
    {
      breed: "Beagle",
      size: "medium",
      energy: "high",
      grooming: "medium",
      goodWithKids: true,
      goodWithPets: true,
      active: true,
      minIncome: 10000,
      space: "medium"
    },
    {
      breed: "Bulldog",
      size: "medium",
      energy: "low",
      grooming: "low",
      goodWithKids: true,
      goodWithPets: true,
      active: false,
      minIncome: 8000,
      space: "small"
    },
    {
      breed: "Golden Retriever",
      size: "large",
      energy: "high",
      grooming: "medium",
      goodWithKids: true,
      goodWithPets: true,
      active: true,
      minIncome: 15000,
      space: "large"
    },
    {
      breed: "Chihuahua",
      size: "small",
      energy: "medium",
      grooming: "low",
      goodWithKids: false,
      goodWithPets: false,
      active: false,
      minIncome: 5000,
      space: "small"
    },
    {
      breed: "Labrador Retriever",
      size: "large",
      energy: "high",
      grooming: "low",
      goodWithKids: true,
      goodWithPets: true,
      active: true,
      minIncome: 14000,
      space: "large"
    },
    {
      breed: "Shih Tzu",
      size: "small",
      energy: "low",
      grooming: "high",
      goodWithKids: true,
      goodWithPets: true,
      active: false,
      minIncome: 9000,
      space: "small"
    },
    {
      breed: "Poodle",
      size: "medium",
      energy: "medium",
      grooming: "high",
      goodWithKids: true,
      goodWithPets: true,
      active: true,
      minIncome: 12000,
      space: "medium"
    },
    {
      breed: "Great Dane",
      size: "large",
      energy: "low",
      grooming: "low",
      goodWithKids: true,
      goodWithPets: true,
      active: false,
      minIncome: 18000,
      space: "large"
    },
    {
      breed: "Cocker Spaniel",
      size: "medium",
      energy: "medium",
      grooming: "medium",
      goodWithKids: true,
      goodWithPets: true,
      active: true,
      minIncome: 11000,
      space: "medium"
    },
    {
      breed: "Pug",
      size: "small",
      energy: "low",
      grooming: "medium",
      goodWithKids: true,
      goodWithPets: true,
      active: false,
      minIncome: 7000,
      space: "small"
    }
  ]
};


    if (!prefs.type || !breeds[prefs.type]) {
      return res.status(400).json({ message: "Invalid or missing pet type" });
    }

    let filtered = breeds[prefs.type].filter(b => {
      return (
        b.size === prefs.size &&
        b.energy === prefs.energy &&
        b.grooming === prefs.grooming &&
        b.space === prefs.space &&
        b.activity === prefs.activity &&
        b.salaryMin <= Number(prefs.salary)
      );
    });

    if (filtered.length === 0) filtered = breeds[prefs.type];

    const suggestions = filtered.map(b => b.breed);

    res.json({ suggestions });

  } catch (error) {
    console.error('Error in /api/suggest-pet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.delete('/api/requests/:id', authMiddleware, async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling request', error: err.message });
  }
});



app.get('/api/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
