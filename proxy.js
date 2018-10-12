const awsXRay = require('aws-xray-sdk');
const path = require('path');
const serializeError = require('serialize-error');

async function handler(event, context) {
  const { ClientContext, FunctionName, InvocationType, LogType, Payload } = event.body;

  // extract the path to the handler (relative to the project root)
  // and the function to call on the handler
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split('.');
  const target = require(path.resolve(event.location, targetHandlerFile));

  const targetEvent = JSON.parse(Payload);
  const targetContext = {
    ...context,
  };

  if (ClientContext) {
    targetContext.clientContext = JSON.parse(Buffer.from(ClientContext, 'base64'));
  }

  const funcResult = new Promise((resolve, reject) => {
    let targetHandler = target[targetHandlerFunction];

    if (event.tracing) {
      const ns = awsXRay.getNamespace();
      if (!ns.active) {
        const [Root, Parent, Sampled] = event.headers['X-Amzn-Trace-Id'].split(';');
        const segment = new awsXRay.Segment(targetHandlerFunction, Root.split('=')[1], Parent.split('=')[1]);
        targetHandler = ns.bind((event, context, callback) => {
          awsXRay.setSegment(segment);
          target[targetHandlerFunction](event, context, (error, result) => {
            segment.close();
            callback(error, result);
          });
        });
      }
    }

    const result = targetHandler(targetEvent, targetContext, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });

    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
      result.then(resolve).catch(reject);
    }
  });

  try {
    return { StatusCode: 200, Payload: JSON.stringify(await funcResult) };
  } catch (error) {
    return { StatusCode: 500, FunctionError: 'Handled (serverless-offline-direct-lambda)', Payload: serializeError(error) };
  }
}

module.exports.handler = handler;
