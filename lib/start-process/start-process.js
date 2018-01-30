var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function startProcessNaode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            clear_status(node)
            format_values(config)
            let user_id = msg.user_id || config.user_id;
            let password = msg.password || config.password;
            let container_name = msg.container_name || config.container_name;
            let url = msg.url || config.url;
            let process_id = msg.process_id || config.process_id;
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            if (!validator.isEmpty(auth_header) && validator.isURL(url) && !validator.isEmpty(container_name) && !validator.isEmpty(process_id)) {
                show_status(node, 'in_progress')
                url = remove_slash(url)
                var options = {
                    method: 'POST',
                    uri: url + '/containers/' + container_name + '/processes/' + process_id + '/instances/',
                    body: msg.payload,
                    headers: {
                        'Authorization': 'Basic ' + auth_header,
                        'Content-Type': 'application/json',
                        'X-KIE-ContentType': 'JSON'
                    },
                    json: true
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
                    node.send(msg);
                    clear_status(node)
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

    RED.nodes.registerType('start-process', startProcessNaode);
}