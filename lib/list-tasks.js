var request = require("request");
var validator = require('validator');
var utils = require('./utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function listTasksNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)            
            format_values(msg)
            format_values(config)
            var user_id = msg.jbpmuser || config.user_id;
            var password = msg.jbpmpassword || config.password;
            if (validator.isURL(config.url) && !validator.isEmpty(user_id) && !validator.isEmpty(password)) {
                show_status(node, 'in_progress')
                remove_slash(config.url)
                var options = {
                    method: 'GET',
                    uri: config.url + '/queries/tasks/instances/pot-owners',
                    headers: {
                        'Authorization': 'Basic ' + new Buffer(user_id + ':' + password).toString('base64'),
                        'Content-Type': 'application/json',
                        'X-KIE-ContentType': 'JSON'
                    }
                }
                request(options, function (error, response, body) {
                    if (error) {
                        msg.statusCode = 500;
                        msg.statusMessage = 'Internal server error';
                        msg.payload = error;
                        show_status(node, 'error')
                        node.error(error);
                    } else {
                        show_status(node, 'success')                                                                           
                        msg.statusCode = response.statusCode;
                        msg.statusMessage = response.statusMessage;                                                  
                        msg.payload = response.body;
                    }
                    try { msg.payload = JSON.parse(msg.payload); } // obj
                                catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    node.send(msg);
                    clear_status(node)
                });
            } else {
                msg.statusCode = 500;
                msg.statusMessage = 'Internal server error';
                msg.payload = 'Please check properties';
                show_status(node, 'error')
                node.error('Please check values');
                node.send(msg);
                clear_status(node)
            }            
        });
    }
    RED.nodes.registerType('list-tasks', listTasksNode);
}