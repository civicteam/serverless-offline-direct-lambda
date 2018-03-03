function handler(event, context, callback) {
  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");

  const target = require('./' + targetHandlerFile);

  const newEvent = {
    body: event.body
  };

  target[targetHandlerFunction](newEvent, context, callback);
}

module.exports.handler = handler;
