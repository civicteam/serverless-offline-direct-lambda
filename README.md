# serverless-offline-direct-lambda
A Serverless Offline plugin that exposes lambdas with no API Gateway event via HTTP, to allow offline direct lambda-to-lambda interactions.

## Setup
Note - this requires the plugin 'serverless-offline'.

To include in your project, add the following to the plugins section in serverless.yml:

```
- serverless-offline-direct-lambda
```

You may also want to change the port that the plugin runs on - you can do this by specifying the following custom config in your serverless yml file:

```yml
custom:
  serverless-offline:
    port: 4000
```

## Running & Calling

To run:

```
servlerless offline start
```

(calling the command 'start' is necessary to trigger the plugin, simply running 'serverless online' does not trigger the start hooks).

The plugin will create api-gateway proxies for all lambdas with *no* triggering events.

You will see output like this:

```bash
export AWS_SDK_USED=node

sls offline start

Serverless: Running Serverless Offline with direct lambda support
Serverless: Starting Offline: dev/us-east-1.

Serverless: Routes for myLambda:
Serverless: (none)

Serverless: Routes for my-project-dev-myLambda_proxy:
Serverless: POST /proxy/my-project-dev-myLambda
Serverless: POST /2015-03-31/functions/my-project-dev-myLambda/invocations
```

### Calling via HTTP Post:

The body of the POST should match the JSON data that would ordinarily be passed in a lambda-to-lambda call. i.e.

```bash
curl -X POST \
  http://localhost:4000/proxy/my-project-dev-myLambda \
  -H 'Cache-Control: no-cache' \
  -H 'Content-Type: application/json' \
  -d '{
    "some-key": "some-value",
    "other-key": false
}'
```

### Invoking the function via the AWS SDK:

You may also invoke the function by using the AWS SDK on your client side...
This can be done by specifying a custom "endpoint" in your Lambda configuration like so:

**Note:** the AWS SDK for NodeJS actually sends a different content type header on it's request to the Lambda API then all the other AWS SDK's (Python, Rails etc).. You will need to `export AWS_SDK_USED=node` before running the `serverless offline` if you wish to use this with the NodeJS AWS SDK. 

```javascript

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

let lambda = new AWS.Lambda({
    region: 'us-east-1',
    endpoint: 'http://localhost:4000'
})

var lambda_args = {
    "some-key": "some-value",
    "other-key": false
}

var params = {
    FunctionName: 'my-project-dev-myLambda', // the lambda function we are going to invoke
    Payload: JSON.stringify(lambda_args)
};

lambda.invoke(params, function(err, data) {
    if (err) {
        console.error(err);
    } else {
        console.dir(data);
    }
})

```

