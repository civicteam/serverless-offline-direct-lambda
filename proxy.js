const serializeError = require('serialize-error');
const path = require('path');

function handler(event, context, callback) {

  const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");
  const target = require(path.resolve(__dirname, '../..', targetHandlerFile));

  // target[targetHandlerFunction](event.body, context)
  //   .then((data) => {
  //     let response = data;
  //     response.body = JSON.stringify(data.body);
  //     callback(null, response);
  //   })
  //   .catch((error) => {
  //     callback(null, serializeError(error));
  //   });

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
