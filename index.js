'use strict';

const packagePath = 'node_modules/serverless-offline-direct-lambda';
const handlerPath = 'proxy.js';

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    const boundStartHandler = this.startHandler.bind(this);

    this.hooks = {
      'before:offline:start': boundStartHandler,
      'before:offline:start:init': boundStartHandler,
    };
  }

  startHandler() {
    // Serverless Webpack overrides the location to its output directory. Set
    // location to that directory.
    let location = '';
    try {
      location = this.serverless.service.custom['serverless-offline'].location || location;
      this.serverless.service.custom['serverless-offline'].location = '';
    } catch (_) { }

    location = `${this.serverless.config.servicePath}/${location}`;

    this.serverless.cli.log('Running Serverless Offline with direct lambda support');

    addProxies(this.serverless.service.functions,
               location,
               this.serverless.service.provider.tracing === 'true');
  }
}

const addProxies = (functionsObject, location, tracing) => {
  Object.keys(functionsObject).forEach(fn => {

    // filter out functions with event config,
    // leaving just those intended for direct lambda-to-lambda invocation
    const functionObject = functionsObject[fn];
    if (!functionObject.events ||
        !functionObject.events.some((event) => Object.keys(event)[0] === 'http')) {
      const pf = functionProxy(functionObject, location, tracing);
      functionsObject[pf.name] = pf;
    }
  });
};

const functionProxy = (functionBeingProxied, location, tracing) => ({
  name: `${functionBeingProxied.name}_proxy`,
  handler: `${packagePath}/proxy.handler`,
  environment: functionBeingProxied.environment,
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
                location,
                headers: `{
                  #set( $map = $input.params().header )
                  #foreach($key in $map.keySet())
                    "$util.escapeJavaScript($key)": "$util.escapeJavaScript($map.get($key))"
                    #if( $foreach.hasNext )
                      ,
                    #end
                  #end
                }`,
                body: "$input.json('$')",
                targetHandler:  functionBeingProxied.handler,
                handlerName: functionBeingProxied.name,
                tracing,
              }
            )
          }
        }
      }
    }
  ],
  package: {
    include: [handlerPath],
  }
});

module.exports = ServerlessPlugin;
