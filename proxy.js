const serializeError = require('serialize-error');
const path = require('path');

async function handler(event, context, callback) {
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

  // call the target function
  return target[targetHandlerFunction](targetEvent, targetContext, (error, response) => {
    if (error) {
      callback(null, {
        StatusCode: 500,
        FunctionError: 'Handled',
        Payload: serializeError(error),
      });
    } else {
      callback(null, {
        StatusCode: 200,
        Payload: JSON.stringify(response),
      });
    }
  });
}

module.exports.handler = handler;
