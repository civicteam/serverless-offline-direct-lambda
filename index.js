'use strict';

const packagePath = 'node_modules/serverless-offline-direct-lambda';
const handlerPath = `proxy.js`;

var AWS_SDK_USED = process.env.AWS_SDK_USED || 'rails';
function AWS_SDK_METHOD(functionBeingProxied, location) {

    if(AWS_SDK_USED == 'node') {

        // Additional support to call the function from the AWS SDK (NodeJS) directly...
        var AWS_SDK_NODE_METHOD = {
          http: {
            method: 'POST',
            // This is the path to the Lambda API..
            path: `2015-03-31/functions/${functionBeingProxied.name}/invocations`,
            integration: 'lambda',
            request: {
              template: {
                // NB: AWS SDK for NodeJS specifies as 'binary/octet-stream' not 'application/json'
                'binary/octet-stream': JSON.stringify(
                  {
                    location,   
                    body: "$input.body",
                    targetHandler :  functionBeingProxied.handler,
                  }
                )
              }
            },
            response: {
              headers: {
                "Content-Type": "application/json"
              }
            }
          }
        };
        return AWS_SDK_NODE_METHOD;

    } else {

        // Additional support to call the function from the All other SDK's (Don't ask why AWS did it like this ......)
        var AWS_SDK_RAILS_METHOD = {
          http: {
            method: 'POST',
            // This is the path to the Lambda API..
            path: `2015-03-31/functions/${functionBeingProxied.name}/invocations`,
            integration: 'lambda',
            request: {
              template: {
                // NB: AWS SDK for NodeJS specifies as 'binary/octet-stream' not 'application/json'
                'application/json': JSON.stringify(
                  {
                    location,   
                    body: "$input.json('$')",
                    targetHandler :  functionBeingProxied.handler,
                  }
                )
              }
            },
            response: {
              headers: {
                "Content-Type": "application/json"
              }
            }
          }
        };
        return AWS_SDK_RAILS_METHOD;
    }

};

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      "before:offline:start:init": this.startHandler.bind(this),
    };
  }

  startHandler() {
    let location = '';
    try {
      location = this.serverless.service.custom['serverless-offline'].location;
      this.serverless.service.custom['serverless-offline'].location = '';
    } catch (_) { }

    this.serverless.cli.log('Running Serverless Offline with direct lambda support');

    addProxies(this.serverless.service.functions, location);
  }
}

const addProxies = (functionsObject, location) => {
  Object.keys(functionsObject).forEach(fn => {

    // filter out functions with event config,
    // leaving just those intended for direct lambda-to-lambda invocation
    const functionObject = functionsObject[fn];
    if (!functionObject.events || functionObject.events.length === 0) {
      const pf = functionProxy(functionObject, location);
      functionsObject[pf.name] = pf;
    }
  });
};

const functionProxy = (functionBeingProxied, location) => ({
  name: `${functionBeingProxied.name}_proxy`,
  handler: `${packagePath}/proxy.handler`,
  environment: functionBeingProxied.environment,
  events: [
    // This is the original `/post/FUNCTION-NAME` from the plugin...
    {
      http: {
        method: 'POST',
        path: `proxy/${functionBeingProxied.name}`,
        integration: 'lambda',
        request: {
          template: {
            'application/json': JSON.stringify(
              {
                location,
                body: "$input.json('$')",
                targetHandler :  functionBeingProxied.handler,
              }
            )
          }
        },
        response: {
          headers: {}
        }
      }
    },
 
    // See methods above for further details
    AWS_SDK_METHOD(functionBeingProxied, location)

  ],
  package: {
    include: [handlerPath],
  }
});

module.exports = ServerlessPlugin;
