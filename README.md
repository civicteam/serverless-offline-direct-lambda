# serverless-offline-direct-lambda
A Serverless Offline plugin that exposes lambdas with no API Gateway event via HTTP, to allow offline direct lambda-to-lambda interactions.

Note - this requires the plugin 'serverless-offline'.

To include in your project, add the following to the plugins section in serverless.yml:

```
- serverless-offline-direct-lambda
```

To run:

```
servlerless offline start
```

(calling the command 'start' is necessary to trigger the plugin, simply running 'serverless online' does not trigger the start hooks).

The plugin will create api-gateway proxies for all lambdas with *no* triggering events.

You will see output like this:

```
$ sls offline start
Serverless: Running Serverless Offline with direct lambda support
Serverless: Starting Offline: dev/us-east-1.

Serverless: Routes for myLambda:
Serverless: (none)

Serverless: Routes for my-project-dev-myLambda_proxy:
Serverless: POST /proxy/my-project-dev-myLambda
```

The body of the POST should match the JSON data that would ordinarily be passed in a lambda-to-lambda call. i.e.
```
{
  "Payload":...
}
```

On the client side, abstract the decision to use a direct AWS.lambda.invoke() call or an http call to the proxy using:
https://github.com/civicteam/lambda-wrapper
