var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

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
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url) && !validator.isEmpty(task_id)) {

                if (save && !complete && msg.payload) {
                    saveFunction(url, auth_header, msg.payload, task_id, container_name, msg);
                } else if (!save && complete) {
                    completeFunction(url, auth_header, {}, task_id, container_name, msg);

                } else if (save && complete && msg.payload) {

                    completeFunction(url, auth_header, msg.payload, task_id, container_name, msg);
                } else {
                    msg.statusCode = 500;
                    msg.statusMessage = 'Internal server error';
                    msg.payload = 'there was some error with save and compelete values';
                    show_status(node, 'error')
                    node.error('there was some error with save and compelete values');
                    node.send(msg);
                    clear_status(node);
                }

            } else {
                msg.statusCode = 500;
                msg.statusMessage = 'Internal server error';
                msg.payload = 'Please check authorisation and url';
                show_status(node, 'error')
                node.error('Please check authorisation and url');
                node.send(msg);
                clear_status(node);
            }
        });
        function saveFunction(url, auth_header, payload, task_id, container_name, msg) {
            url = remove_slash(url);
            var headers = {
                'Authorization': 'Basic ' + auth_header,
                'Content-Type': 'application/json',
                'X-KIE-ContentType': 'JSON'
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
                    node.error(error);
                    msg.statusCode = 500;
                    msg.statusMessage = 'Internal server error';
                    msg.payload = error;
                    show_status(node, 'error')
                    node.log(JSON.stringerror);
                    node.error(error);
                    clear_status(node)
                } else {
                    show_status(node, 'success')
                    msg.statusCode = response.statusCode;
                    msg.statusMessage = response.statusMessage;
                    if (response.statusCode == 201)
                        msg.payload = { 'saveInstance':  response.body };
                    else
                        msg.payload = response.body;
                }
                node.send(msg);
                clear_status(node)
            });
        }
        function completeFunction(url, auth_header, payload, task_id, container_name, msg) {
            var headers = {
                'Authorization': 'Basic ' + auth_header,
                'Content-Type': 'application/json',
                'X-KIE-ContentType': 'JSON'
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
                    msg.statusCode = 500;
                    msg.statusMessage = 'Internal server error';
                    msg.payload = error;
                    show_status(node, 'error')
                    node.error(error);
                    clear_status(node)
                } else {
                    show_status(node, 'success')
                    msg.statusCode = response.statusCode;
                    msg.statusMessage = response.statusMessage;
                    if (response.statusCode == 201)
                        msg.payload = { 'completed': true };
                    else
                        msg.payload = response.body;
                }
                node.send(msg);
                clear_status(node)
            });
        }
    }
    RED.nodes.registerType('check-in', checkInNode);
}