const path = require('path');

function handler(event, context, callback) {
    // extract the path to the handler (relative to the project root)
    // and the function to call on the handler
    const [targetHandlerFile, targetHandlerFunction] = event.targetHandler.split(".");
    const target = require(path.resolve(__dirname, '../..', event.location, targetHandlerFile));
    const headers = event.headers;

    if (headers["X-Amz-Invocation-Type"] === "DryRun") {
        return;
    }

    // call the target function
    const targetResponse = target[targetHandlerFunction](event.body, context, (error, response) => {
        if (headers["X-Amz-Invocation-Type"] === "RequestResponse") {
            if (error) {
                callback(error)
            }

            callback(null, JSON.stringify(response))
        }
    });

    if (targetResponse && headers["X-Amz-Invocation-Type"] === "RequestResponse") {
        return targetResponse;
    }
}

module.exports.handler = handler;
