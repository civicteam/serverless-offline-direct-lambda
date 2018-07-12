const serializeError = require('serialize-error');
const path = require('path');

async function handler(event, context) {
  const { ClientContext, FunctionName, InvocationType, LogType, Payload } = event.body;

  // extract the path to the handler (relative to the project root)
  // and the function to call on the handler
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split('.');
  const target = require(path.resolve(__dirname, '../..', event.location, targetHandlerFile));

  const targetEvent = JSON.parse(Payload);
  const targetContext = {
    ...context,
    clientContext: JSON.parse(Buffer.from(ClientContext, 'base64')),
  };

  const funcResult = new Promise((resolve, reject) => {
    const result = target[targetHandlerFunction](targetEvent, targetContext, (error, response) => {
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
    return { StatusCode: 500, FunctionError: 'Handled', Payload: serializeError(error) };
  }
}

module.exports.handler = handler;
