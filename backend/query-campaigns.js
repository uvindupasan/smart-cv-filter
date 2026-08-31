const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Campaign = require('./models/Campaign');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cv_filter')
  .then(async () => {
    console.log('Connected to MongoDB.');
    const campaigns = await Campaign.find();
    console.log('Campaigns found:', campaigns.map(c => ({ id: c._id, position: c.position, slug: c.slug, isActive: c.isActive })));
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
