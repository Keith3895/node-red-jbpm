var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function setOutputNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            clear_status(node)
            msg.task_id = (msg.task_id || "").toString();            
            format_values(msg)
            format_values(config)
            //msg.payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
			var user_id = msg.user_id || config.user_id;
            var password = msg.password || config.password;
            var container_name = msg.container_name || config.container_name;
            var task_id = msg.task_id || config.task_id;
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            if (validator.isURL(config.url) && !validator.isEmpty(container_name) && !validator.isEmpty(task_id) && !validator.isEmpty(auth_header) ) {
                config.url = remove_slash(config.url)
                var headers = {
                    'Authorization': 'Basic ' + auth_header,
                    'Content-Type': 'application/json',
                    'X-KIE-ContentType': 'JSON'
                };

                var options = {
                    method: 'PUT',
                    uri: config.url + '/containers/' + container_name + '/tasks/' + task_id + '/contents/output',
                    headers: headers,
                    body: msg.payload,
					json: true
                }
                // console.log(options);
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
                        msg.payload = response.body;
                    }
                    node.send(msg);
                    clear_status(node)
                });
            } else {
                msg.statusCode = 500;
                msg.statusMessage = 'Internal server error';
                msg.payload = 'Please check properties, they dont seem right';
                show_status(node, 'error')
                node.error('Please check properties, they dont seem right');
                node.send(msg);
                clear_status(node)
            }
            
        });
    }

    RED.nodes.registerType('set-output', setOutputNode);
}
