'use strict';

const packagePath = 'node_modules/serverless-dependency-invoke';
const handlerPath = `proxy.js`;
const exec = require('child_process').exec;
const path = require('path');
const fs = require('fs');

class ServerlessPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.hooks = {
            "before:offline:start:init": this.aquireDependencies.bind(this)
        };
    }

    async aquireDependencies() {
        const config = this.serverless.service.custom["dependency-invoke"];
        const dependencies = config.dependencies;
        const storage = path.join(this.serverless.service.serverless.config.servicePath, "dependencies");
        let dependencyPromiseArray = [];

        if (!fs.existsSync(storage)) {
            fs.mkdirSync(storage);
        }

        dependencyPromiseArray = await dependencies.map((dependency) => {
            return new Promise((resolve, reject) => {
                if (dependency.lang === "javascript") {
                    dependency.storage = path.join(storage, dependency.name).replace("/.build", "");
                }

                dependency.handler = path.join(dependency.storage, dependency.handler);

                if (!fs.existsSync(dependency.storage)) {
                    this.serverless.cli.log(`Fetching dependency ${dependency.name}...`);
                    exec(`git clone ${dependency.git} ${dependency.storage}`, async (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        }

                        this.serverless.cli.log(`Fetched dependency ${dependency.name}`);

                        this.executeFlow(dependency)
                            .then(() => {
                                resolve(dependency);
                            })
                            .catch((error) => {
                                reject(error)
                            });
                    });
                } else {
                    this.serverless.cli.log(`Updating dependency ${dependency.name}...`);
                    exec(`cd ${dependency.storage} && git reset --hard origin/${dependency.branch} && git pull`, async (error, stdout, stderr) => {
                        if (error) {
                            reject(error);
                        }

                        this.serverless.cli.log(`Updated dependency ${dependency.name}`);

                        this.executeFlow(dependency)
                            .then(() => {
                                resolve(dependency);
                            })
                            .catch((error) => {
                                reject(error)
                            });
                    });
                }
            });
        });

        return Promise.all(dependencyPromiseArray)
            .then((dependency) => {
                this.startHandler(dependencies);
            });
    }

    async executeFlow(dependency) {
        const commands = dependency.commands;

        if (!commands) {
            throw new Error(`Commands were not defined for dependency ${dependency.name}`);
        }

        for (const command of commands) {
            this.serverless.cli.log(`[${dependency.name}] Executing "${command}"...`);
            await execPromise(`cd ${dependency.storage} && ${command}`)
                .catch((error) => {
                    this.serverless.cli.log(`Command ${command} failed\n${error}`);
                });
        }

        return;
    }

    startHandler(dependencies) {
        let location = '';
        try {
            location = this.serverless.service.custom['serverless-offline'].location;
            this.serverless.service.custom['serverless-offline'].location = '';
        } catch (_) {
        }

        const storage = path.join(this.serverless.service.serverless.config.servicePath, "dependencies");

        const functions = this.serverless.service.functions;

        dependencies.forEach((dependency) => {
            this.serverless.cli.log(`Dependency ${dependency.name} loaded`);
            functions[dependency.name] = functionProxy(dependency, location);
        });

    }
}

const functionProxy = (dependency, location) => ({
    name: `${dependency.name}_proxy`,
    handler: `${packagePath}/proxy.handler`,
    events: [
        {
            http: {
                method: 'POST',
                path: `2015-03-31/functions/${dependency.name}/invocations`,
                integration: 'lambda',
                request: {
                    template: {
                        'binary/octet-stream': JSON.stringify(
                            {
                                location,
                                body: "$input.body",
                                headers: {
                                    "X-Amz-Invocation-Type": "$input.params().header.get('X-Amz-Invocation-Type')",
                                    "X-Amz-Log-Type": "$input.params().header.get('X-Amz-Log-Type')",
                                    "X-Amz-Client-Context": "$input.params().header.get('X-Amz-Client-Context')"
                                },
                                targetHandler : dependency.handler,
                            }
                        )
                    }
                },
                response: {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            }
        }
    ],
    package: {
        include: [handlerPath],
    }
});

const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) reject(error);
            resolve(stdout)
        });
    });
};

module.exports = ServerlessPlugin;
