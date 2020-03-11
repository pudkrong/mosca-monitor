'use strict';

require('dotenv').config();
const Monitor = require('./monitor');

const monitor = new Monitor(process.env.MQTT_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  connectTimeout: 5000,
  topics: process.env.MQTT_TOPICS.split(','),
});

process.on('SIGINT', async () => {
  await monitor.close();
  process.exit(0);
});