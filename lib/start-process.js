var request = require("request");
var validator = require('validator');
var utils = require('./utils');
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
            if (validator.isURL(config.url) && !validator.isEmpty(config.container_name) && !validator.isEmpty(config.process_name) && !validator.isEmpty(config.user_id) && !validator.isEmpty(config.password)) {
                show_status(node, 'in_progress')
                config.url = remove_slash(config.url)
                var options = {
                    method: 'POST',
                    uri: config.url + '/containers/' + config.container_name + '/processes/' + config.process_name + '/instances/',
                    body: msg.payload,
                    headers: {
                        'Authorization': 'Basic ' + new Buffer(config.user_id + ':' + config.password).toString('base64'),
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