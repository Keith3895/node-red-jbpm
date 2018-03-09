var request = require("request");
var validator = require('../validator');
var utils = require('../utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function getVariable(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)            
            msg.process_instance_id = (msg.process_instance_id || "").toString();
            format_values(msg)
            format_values(config)
            var user_id = msg.user_id || config.user_id;
            var password = msg.password || config.password;
            var process_instance_id=msg.process_instance_id || config.process_instance_id;
            var container_name = msg.container_name || config.container_name;
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            if (validator.isURL(config.url) && !validator.isEmpty(container_name) && !validator.isEmpty(process_instance_id) && !validator.isEmpty(auth_header)) {
                config.url = remove_slash(config.url)
                
                var headers = {
                    'Authorization': 'Basic ' + auth_header,
                    'Content-Type': 'application/json',
                    'X-KIE-ContentType': 'JSON'
                };

                var options = {
                    method: 'GET',
                    uri: config.url + '/containers/'+container_name+'/processes/instances/'+process_instance_id+'/variables',
                    headers: headers
                }

                request(options, function (error, response, body) {
                    if (error) {
                        msg.statusCode = 500;
                        msg.statusMessage = 'Internal server error';
                        msg.payload = error;
                        show_status(node, 'error');
                        node.error(error);
                        clear_status(node);
                    } else {
                        show_status(node, 'success')                                                                           
                        msg.statusCode = response.statusCode;
                        msg.statusMessage = response.statusMessage;
                        
                        msg.payload = response.body;                        
                    }
                    try { msg.payload = JSON.parse(msg.payload); } // obj
                                catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    node.send(msg);
                    clear_status(node);
                });
            } else {
                msg.statusCode = 500;
                msg.statusMessage = 'Internal server error';
                msg.payload = 'Please check properties';
                show_status(node, 'error');
                node.error('Please check properties');
                node.send(msg);
                clear_status(node);
            }
        });
    }

    RED.nodes.registerType('get-variable', getVariable);
}
