'use strict';

module.exports.hello = (event, context, callback) => {
  console.log("In Lambda");
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  });
};
