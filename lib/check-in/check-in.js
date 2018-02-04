var request = require("request");
var validator = require('validator');
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
            let user_id = msg.jbpmuser || config.user_id;
            let password = msg.jbpmpassword || config.password;
            let container_name = msg.container_name || config.container_name;
            let task_id = msg.task_id || config.task_id;
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            let url = msg.url || config.url;
            let save = msg.save || config.save;
            let complete = msg.complete || config.complete;
            let content_type = msg.content_type || config.content_type;
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url) && !validator.isEmpty(task_id)) {

                if (save && !complete && msg.payload) {
                    saveFunction(url,content_type, auth_header, msg.payload, task_id, container_name, msg);
                } else if (!save && complete) {
                    completeFunction(url,content_type, auth_header, {}, task_id, container_name, msg);

                } else if (save && complete && msg.payload) {

                    completeFunction(url,content_type, auth_header, msg.payload, task_id, container_name, msg);
                } else {
                    showMessage(500, 'Internal server error', 'there was some error with save and compelete values', 'error', 'there was some error with save and compelete values', msg, node);
                }

            } else {
                showMessage(500, 'Internal server error', 'Please check authorisation and url', 'error', 'Please check authorisation and url', msg, node);
            }
        });
        function saveFunction(url,content_type, auth_header, payload, task_id, container_name, msg) {
            url = remove_slash(url);
            var headers = {
                'Authorization': 'Basic ' + auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'PUT',
                uri: url + '/containers/' + container_name + '/tasks/' + task_id + '/contents/output',
                headers: headers,
                body: payload,
                json: true
            };
            request(options, function (error, response, body) {
                if (error) {
                    node.log("ErrorOccurred");
                    showMessage(500, 'Internal server error', error, 'error', error, msg, node);
                } else {
                    if (response.statusCode == 201)
                        msg.payload = { 'saveInstance': response.body };
                    else
                        msg.payload = response.body;
                    showMessage(response.statusCode, response.statusMessage, msg.payload, 'success', false, msg, node);
                }
            });
        }
        function completeFunction(url,content_type, auth_header, payload, task_id, container_name, msg) {
            var headers = {
                'Authorization': 'Basic ' + auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'PUT',
                uri: url + '/containers/' + container_name + '/tasks/' + task_id + '/states/completed',
                headers: headers,
                body: payload,
                json: true
            }
            console.log(options.uri);
            console.log(options.body);
            request(options, function (error, response, body) {
                if (error) {
                    node.log("ErrorOccurred");
                    showMessage(500, 'Internal server error', error, 'error', error, msg, node);
                } else {
                    if (response.statusCode == 201)
                        msg.payload = { 'completed': true };
                    else
                        msg.payload = response.body;
                    showMessage(response.statusCode, response.statusMessage, msg.payload, 'success', false, msg, node);
                }

            });
        }
    }
    RED.nodes.registerType('check-in', checkInNode);
}
