var http = require('http');
var urlPack = require('url');
var validator = require('../validator');
var utils = require('../utils');
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;
var showMessage = utils.showMessage;
module.exports = function (RED) {
    function checkInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)
            msg.task_id = (msg.task_id || "").toString();
            format_values(msg)
            format_values(config)
            let user_id = msg.user_id || config.user_id;
            let password = msg.password || config.password;
            let container_name = msg.container_name || config.container_name;
            let task_id = msg.task_id || config.task_id;
            let auth_header = msg.auth_header || "Basic " + new Buffer(user_id + ':' + password).toString('base64');
            let url = msg.url || config.url;
            let save = msg.save || config.save;
            let complete = msg.complete || config.complete;
            let content_type = msg.content_type || config.content_type;
            let owner = msg.owner || config.owner;
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url) && !validator.isEmpty(task_id)) {

                if (save && !complete && msg.payload) {
                    console.log("in save call");
                    saveFunction(url, content_type, auth_header, msg.payload, task_id, container_name, owner, msg);
                } else if (!save && complete) {
                    completeFunction(url, content_type, auth_header, {}, task_id, container_name, owner, msg);

                } else if (save && complete && msg.payload) {

                    completeFunction(url, content_type, auth_header, msg.payload, task_id, container_name, owner, msg);
                } else {
                    showMessage(500, 'Internal server error', 'there was some error with save and compelete values', 'error', 'there was some error with save and compelete values', msg, node);
                }

            } else {
                showMessage(500, 'Internal server error', 'Please check authorisation and url', 'error', 'Please check authorisation and url', msg, node);
            }
        });
        function saveFunction(url, content_type, auth_header, payload, task_id, container_name, owner, msg) {
            url = remove_slash(url);
            console.log("in save call");
            var headers = {
                'Authorization': auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'PUT',
                headers: headers,
            };
            url += '/containers/' + container_name + '/tasks/' + task_id + '/contents/output';
            if (!validator.isEmpty(owner))
                url += '?user=' + owner;
            url = urlPack.parse(url);
            options = Object.assign(options, url);
            console.log(options);
            var req = http.request(options, function (res) {
                var buffer = "";
                res.on("data", function (data) { buffer = buffer + data; });
                res.on("end", function (data) {
                    msg.payload = buffer;
                    showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                });
            });
            req.on('error', (e) => {
                showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
            });
            payload = typeof payload == 'string' ? payload : JSON.stringify(payload);
            req.write(payload);
            req.end();
        }
        function completeFunction(url, content_type, auth_header, payload, task_id, container_name, owner, msg) {
            var headers = {
                'Authorization': auth_header,
                'Content-Type': content_type,
            };
            url = remove_slash(url);
            url += '/containers/' + container_name + '/tasks/' + task_id + '/states/completed';
            if (!validator.isEmpty(owner))
                url += '?user=' + owner;
            url = urlPack.parse(url);
            var options = {
                method: 'PUT',
                headers: headers
            }
            options = Object.assign(options, url);
            var req = http.request(options, function (res) {
                var buffer = "";
                res.on("data", function (data) { buffer = buffer + data; });
                res.on("end", function (data) {
                    msg.payload = buffer;
                    showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                });
            });
            req.on('error', (e) => {
                showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
            });
            payload = typeof payload == 'string' ? payload : JSON.stringify(payload);
            req.write(payload);
            req.end();
        }
    }
    RED.nodes.registerType('check-in', checkInNode);
}