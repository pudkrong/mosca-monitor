'use strict';

const mqtt = require('mqtt');
const EventEmitter = require('events').EventEmitter;
const Table = require('cli-table3');

class Monitor extends EventEmitter {
  constructor (url, options) {
    super();

    this.url = url;
    this.options = Object.assign({
      clean: true,      
    }, options);

    this.data = {};
    this.client = mqtt.connect(url, options);    
    this.client
      .on('connect', this._onConnect.bind(this))
      .on('error', this._onError.bind(this))
      .on('message', this._onMessage.bind(this))
      .on('close', this._onClose.bind(this));

    this.serverData = new Map();
    this.clientData = new Map();
    this.on('data', this.print);
  }

  _onConnect () {
    console.log(`Mqtt is connected to ${this.url}`);

    this.client.subscribe(this.options.topics);
  }

  _onError (error) {
    console.error(`Mqtt error: `, error);
  }

  _onClose () {
    console.error(`Mqtt is disconnected`);
  }

  _onMessage (topic, message) {
    clearTimeout(this._timeoutSum);

    const matches = /\$SYS\/(\w+)-([^\/]+)\/(.+)/.exec(topic);
    if (matches) {
      const no = Number.parseFloat(message.toString());
      const type = matches[1];
      const hostname = matches[2];
      const metric = matches[3];

      this.emit('data', { type, hostname, metric, data: no });
    }
  }

  print (raw) {
    const { type, hostname, metric, data } = raw;

    const mapData = type == 'client' ? this.clientData : this.serverData;
    let temp = mapData.get(hostname);
    if (!temp) temp = new Map();
    temp.set(metric, data);

    mapData.set(hostname, temp);

    console.clear();
    this.format('client');
    this.format('server');
  }

  format (type) {
    const data = type == 'client' ? this.clientData : this.serverData;
    if (!data.size) return;    

    const header = [type];
    for (let [key, value] of data.values().next().value) {
      header.push(key);
    }
        
    const table = new Table({ head: header });
    for (let [key, value] of data) {
      let row = [];      
      for (let i = 1; i < header.length; i++) row.push(value.get(header[i]));

      const obj = {};
      obj[key] = row;
      table.push(obj);
    }

    console.log(table.toString());
  }

  async close () {
    return new Promise((resolve, reject) => {
      this.client.end(resolve);
    });
  }
}

module.exports = Monitor;
