const serializeError = require('serialize-error');
const path = require('path');

function handler(event, context, callback) {
  // extract the path to the handler (relative to the project root)
  // and the function to call on the handler
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");
  const target = require(path.resolve(__dirname, '../..', event.location, targetHandlerFile));

  // call the target function
  target[targetHandlerFunction](event.body, context, (error, response) => {
    if (error) {
      callback(null, {
        StatusCode: 500,
        FunctionError: 'Handled',
        Payload: serializeError(error)
      })
    } else {
      callback(null, {
        StatusCode: 200,
        Payload: JSON.stringify(response)
      })
    }
  });
}

module.exports.handler = handler;
