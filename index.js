'use strict';

const packagePath = 'node_modules/serverless-offline-direct-lambda';
const handlerPath = `proxy.js`;

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      "before:offline:start:init": this.startHandler.bind(this),
    };
  }

  startHandler() {
    this.serverless.cli.log('Running Serverless Offline with direct lambda support');

    addProxies(this.serverless.service.functions);
  }
}

const addProxies = functionsObject => {
  Object.keys(functionsObject).forEach(fn => {

    // filter out functions with event config,
    // leaving just those intended for direct lambda-to-lambda invocation
    const functionObject = functionsObject[fn];
    if (!functionObject.events || functionObject.events.length == 0) {
      const pf = functionProxy(functionObject);
      functionsObject[pf.name] = pf;
    }
  });
};

const functionProxy = functionBeingProxied => ({
  name: `${functionBeingProxied.name}_proxy`,
  handler: `${packagePath}/proxy.handler`,
  events: [
    {
      http: {
        method: 'POST',
        path: `proxy/${functionBeingProxied.name}`,
        integration: 'lambda',
        request: {
          template: {
            'application/json': JSON.stringify(
              {
                targetHandler :  functionBeingProxied.handler,
                body: "$input.json('$')"
              }
            )
          }
        },
        response: {
          headers: {}
        }
      }
    }
  ],
  package: {
    include: [handlerPath],
  }
});

module.exports = ServerlessPlugin;
