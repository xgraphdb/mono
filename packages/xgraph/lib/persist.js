const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = class Persister {
  constructor(datapath) {
    this.datapath = datapath;
    const { name, dir } = path.parse(this.datapath);
    this.name = name;
    this.dir = dir;
    if (this.dir) {
      mkdirp.sync(dir);
    }
    this.exists = fs.existsSync(this.datapath);
    this.lastWriteValue = null;
    this.lock = null;
  }

  readJSON() {
    if (!this.exists) return null;
    return JSON.parse(fs.readFileSync(this.datapath, { encoding: 'utf8' }));
  }

  async writeJSON(data) {
    if (this.lastWriteValue) {
      this.lastWriteValue = data;
      return;
    }
    this.lastWriteValue = data;
    const currentLock = this.lock;
    this.lock = (async () => {
      if (currentLock) {
        await currentLock;
      }
      const data = this.lastWriteValue;
      this.lastWriteValue = null;
      return new Promise(resolve =>
        fs.writeFile(this.datapath, JSON.stringify(data), resolve)
      );
    })();
  }
};
