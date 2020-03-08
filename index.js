'use strict';

require('dotenv').config();
const Monitor = require('./monitor');

const monitor = new Monitor(process.env.URL, {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  connectTimeout: 5000,
  topics: process.env.TOPICS.split(','),
});

process.on('SIGINT', async () => {
  await monitor.close();
  process.exit(0);
});