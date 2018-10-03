const serializeError = require('serialize-error');
const awsSerializedError = error => {
  if (typeof error === 'string')
    return { errorMessage: error }

  const { name, message, stack } = serializeError(error)
  
  return {
    errorMessage: message,
    errorName: name,
    errorStack: stack,
  }
  
}
function handler(event, context, callback) {
  // extract the path to the handler (relative to the project root)
  // and the function to call on the handler
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");
  const target = require('../../' + targetHandlerFile);

  // call the target function
  target[targetHandlerFunction](event.body, context, (error, response) => {
    if (error) {
      callback(null, {
        StatusCode: 200,
        FunctionError: 'Handled',
        Payload: awsSerializedError(error)
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
