const Helper = require('@codeceptjs/helper');

class MyHelper extends Helper {
  doAwesomeThings() {
    console.log('Hello from MyHelpr');
  }
}

export = MyHelper;
