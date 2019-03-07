# serverless-dependency-invoke

This Serverless plugin allows you to define any number of dependency Serverless projects, define the git source from which to fetch each dependency, and a set of commands to be run afterwards.

This plugin requires you to have:
* NodeJS 8.10 or later
* [serverless-offline](https://www.npmjs.com/package/serverless-offline)
* Git installed and in your `PATH`

and is also compatible with [serverless-plugin-typescript](https://www.npmjs.com/package/serverless-plugin-typescript).


### Installation
* `npm install --save-dev serverless-dependency-invoke`

### Configuration
The configuration for this plugin must be defined under `custom.dependency-invoke` as follows:
```
custom:
  dependency-invoke:
    storage: dependencies
    dependencies:
      - name: your-project-name
        lang: javascript
        git: git@github.com:you/your-project-name.git
        branch: master
        handler: path/to/handler.handlerFn
        commands:
          - npm install
          - node_modules/serverless/bin/serverless dynamodb install
          - node_modules/serverless/bin/serverless dynamodb start
```

##### Storage
* The `storage` configuration may be found under `custom.dependency-invoke.storage` and defines the directory where your dependencies will be stored.

##### Dependencies
* The `dependencies` configuration may be found under `custom.dependency-invoke.dependencies`, and is an array of dependencies you need to load before starting.
    * `name` specifies the name of your project
    * `lang` specifies the language your project is written in. Valid values are `javascript`, `typescript`.
    * `git` specifies the git resource from which to pull the source code.
    * `branch` specifies the remote branch from which you want to pull the source code. The source code is pulled at every start
    * `handler` specifies the path to the dependency project handler, in the same format as serverless expects. This path is relative to the dependency's directory.
    * `commands` is an array of shell commands you wish to run after the project has been pulled. The commands run sequentially, and are your way of setting up the project (installing dependencies, restructuring files, etc.).  
### Serverless
To enable this plugin, you need to add it in your plugin configuration under `plugins`:
```
plugins:
    - serverless-dependency-invoke
```
Please note that the order of plugins is important, and this plugin needs to be loaded after `serverless-offline`. If you use `serverless-plugin-typescript`, you need to load it before `serverless-offline`.

### Lambda Invocation
The dependencies that are loaded are exposed via serverless-offline in the same way that [AWS Lambda](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html) expects, and allow you to invoke your dependencies by using the AWS SDK:
```
const lambda = new AWS.Lambda({ apiVersion: "2015-03-31", endpoint: "http://localhost:3000" });
lambda.invoke({
  FunctionName: "your-function-name",
  InvocationType: "Event",
  LogType: "Tail",
  Payload: JSON.stringify({
      your_custom_event_attribute: your_custom_event_value
  }),
}).promise()
.then((response) => {
    console.log(response);
})
```

### Known issues
* If you are using `serverless-plugin-typescript`, you may notice that errors occur when this plugin tries to recompile the ts files. This happens because the plugin is looking at your Lambda invocation proxy event that is constructed by this plugin, and attempts to compile any ts files, although there aren't any.

#### Copyright & license
This plugin was made for a very specific use case, and is what I'd call a big hack. If you reached this corner of the internet in your desperate search for something like this, I feel bad for you.

The license is MIT, and you are free to do whatever you want with this. If you find any issues, you can feel free to make a ticket in the issues section, fix the issue yourself and make a PR, or even fork this repo. 
