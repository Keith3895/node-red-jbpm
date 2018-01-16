var request = require("request");
var validator = require('validator');
var utils = require('./utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function checkOutNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)
            msg.task_id = (msg.task_id || "").toString();
            format_values(msg)
            format_values(config)
            if (validator.isURL(config.url) && !validator.isEmpty(config.container_name) && !validator.isEmpty(msg.task_id) && !validator.isEmpty(config.user_id) && !validator.isEmpty(config.password)) {
                config.url = remove_slash(config.url)
                var headers = {
                    'Authorization': 'Basic ' + new Buffer(config.user_id + ':' + config.password).toString('base64'),
                    'Content-Type': 'application/json',
                    'X-KIE-ContentType': 'JSON'
                };

                var options = {
                    method: 'PUT',
                    uri: config.url + '/containers/' + config.container_name + '/tasks/' + msg.task_id + '/states/claimed',
                    headers: headers
                }

                request(options, function (error, response, body) {
                    if (error) {
                        msg.statusCode = 500;
                        msg.statusMessage = 'Internal server error';
                        msg.payload = error;
                        show_status(node, 'error')
                        node.error(error);
                        clear_status(node)
                    } else {
                        options = {
                            method: 'GET',
                            uri: config.url + '/containers/' + config.container_name + '/tasks/' + msg.task_id + '/contents/input',
                            headers: headers
                        }
                        request(options, function (err, resp, body) {
                            if (err) {
                                msg.statusCode = 500;
                                msg.statusMessage = 'Internal server error';
                                msg.payload = error;
                                show_status(node, 'error')
                                node.error(err);
                                clear_status(node)
                            } else {
                                options = {
                                    method: 'PUT',
                                    uri: config.url + '/containers/' + config.container_name + '/tasks/' + msg.task_id + '/states/started',
                                    headers: headers
                                }
                                request(options, function (er, res, body) {
                                    if (er) {
                                        msg.statusCode = 500;
                                        msg.statusMessage = 'Internal server error';
                                        msg.payload = error;
                                        show_status(node, 'error')
                                        node.error(er);
                                    } else {
                                        show_status(node, 'success')                                                                           
                                        msg.statusCode = response.statusCode;
                                        msg.statusMessage = response.statusMessage;                                                  
                                        msg.payload = response.body;
                                    }
                                    node.send(msg);
                                    clear_status(node)
                                });
                            }
                        });
                    }
                });
            } else {
                msg.statusCode = 500;
                msg.statusMessage = 'Internal server error';
                msg.payload = 'Please check properties';
                show_status(node, 'error')
                node.error('Please check properties');
                node.send(msg);
                clear_status(node)
            }
        });
    }
    RED.nodes.registerType('check-out', checkOutNode);
}