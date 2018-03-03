function handler(event, context, callback) {
  // extract the path to the handler (relative to the project root)
  // and the function to call on the handler
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");
  const target = require('../../' + targetHandlerFile);

  // remove all fields from the incoming event leaving just the body
  const newEvent = {
    body: event.body
  };

  // call the target function
  target[targetHandlerFunction](newEvent, context, callback);
}

module.exports.handler = handler;
