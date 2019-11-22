/*--------------------------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See https://go.microsoft.com/fwlink/?linkid=2090316 for license information.
 *-------------------------------------------------------------------------------------------------------------*/

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const rimrafCb = require('rimraf');
const mkdirpCb = require('mkdirp');
const copyFilesCb = require('copyfiles');
const spawnCb = require('child_process').spawn;

module.exports = {
    // async spawn
    spawn: async (command, args, opts) => {
        console.log(`(*) Spawn: ${command}${args.reduce((prev, current) => `${prev} ${current}`, '')}`);

        opts = opts || { stdio: 'inherit', shell: true };
        return new Promise((resolve, reject) => {
            let result = '';
            let errorOutput = '';
            const proc = spawnCb(command, args, opts);
            proc.on('close', (code, signal) => {
                if (code !== 0) {
                    console.log(result);
                    console.error(errorOutput);
                    reject(`Non-zero exit code: ${code} ${signal || ''}`);
                    return;
                }
                resolve(result);
            });
            if (proc.stdout) {
                proc.stdout.on('data', (chunk) => result += chunk.toString());
            }
            if (proc.stderr) {
                proc.stderr.on('data', (chunk) => result += chunk.toString());
            }
            proc.on('error', reject);
        });
    },

    // async rename
    rename: async (from, to) => {
        return new Promise((resolve, reject) => {
            fs.rename(from, to, (err) => err ? reject(err) : resolve());
        });
    },

    // async readFile
    readFile: async (filePath) => {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => err ? reject(err) : resolve(data.toString()));
        });
    },

    // async writeFile
    writeFile: async function (filePath, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, 'utf8', (err) => err ? reject(err) : resolve(filePath));
        });
    },

    // async mkdirp
    mkdirp: async (pathToMake) => {
        return new Promise((resolve, reject) => {
            mkdirpCb(pathToMake, (err, made) => err ? reject(err) : resolve(made));
        });
    },

    // async rimraf
    rimraf: async (pathToRemove, opts) => {
        opts = opts || {};
        return new Promise((resolve, reject) => {
            rimrafCb(pathToRemove, opts, (err) => err ? reject(err) : resolve(pathToRemove));
        });
    },

    // async copyfiles
    copyFiles: async (source, blobs, target) => {
        return new Promise((resolve, reject) => {
            process.chdir(source);
            copyFilesCb(
                blobs.concat(target),
                { all: true },
                (err) => err ? reject(err) : resolve(target));
        });
    },

    // async readdir
    readdir: async (dirPath, opts) => {
        opts = opts || {};
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, opts, (err, files) => err ? reject(err) : resolve(files));
        });
    },

    // async exists
    exists: async (filePath) => {
        return fs.existsSync(filePath);
    },

    // async gen SHA 256 hash for file
    shaForFile: async (filePath) => {
        return new Promise((resolve, reject) => {
            const fd = fs.createReadStream(filePath);
            const hash = crypto.createHash('sha256');
            hash.setEncoding('hex');
            fd.on('end', function () {
                hash.end();
                resolve(hash.read());
            });
            fd.on('error', (err) => {
                reject(err);
            });
            fd.pipe(hash);
        })
    },

    // async gen SHA 256 hash for string
    shaForString: (content) => {
        const hash = crypto.createHash('sha256');
        hash.update(content);
        return hash.digest('hex');
    },

    // async HTTPS get
    getUrlAsString: async (url) => {
        return new Promise((resolve, reject) => {
            let content = '';
            const req = https.get(url, function (res) {
                res.on('data', function (chunk) {
                    content += chunk.toString();
                });
            });
            req.on("error", reject);
            req.on('close', () => resolve(content));
        });
    }
};
