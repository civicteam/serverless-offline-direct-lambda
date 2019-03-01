# serverless-dependency-invoke

This Serverless plugin allows you to define any number of dependency Serverless projects, define the git source from which to fetch each dependency, and a set of commands to be run afterwards.

This plugin requires you to have:
* NodeJS 8.10 or later
* [serverless-offline](https://www.npmjs.com/package/serverless-offline)

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
        branch: develop
        handler: path/to/handler.handlerFn
        commands:
          - npm install
          - node_modules/serverless/bin/serverless dynamodb install
          - node_modules/serverless/bin/serverless dynamodb start --port 8003 -m --seed=technical-records
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

### Lambda Invocation
The dependencies that are loaded are exposed via serverless-offline in the same format that [AWS Lambda](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html) uses, and allow you to invoke your dependencies by calling invoke:
```
AWS.Lambda.invoke(invokeParams).promise({
    FunctionName: "your-function-name",
    InvocationType: "Event",
    LogType: "Tail",
    Payload: JSON.stringify({
        your_custom_event_attribute: your_custom_event_value
    }),
})
.then((response: any) => {
    console.log(response);
})
```

#### Copyright & license
This plugin was made for a very specific use case, and is what I'd call a big hack. If you reached this corner of the internet in your desperate search for this and you have the same use case, i feel bad for you.

The license is MIT, and you are free to do whatever you want with this. If you find any issues, you can feel free to make a ticket in the issues section, fix the issue yourself and make a PR, or even fork this repo. 
