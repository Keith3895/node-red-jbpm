var request = require("request");
var validator = require('validator');
var utils = require('./utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function getTaskInstanceDetails(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)            
            msg.task_id = (msg.task_id || "").toString();
            format_values(msg)
            format_values(config)
            var user_id = msg.jbpmuser || config.user_id;
            var password = msg.jbpmpassword || config.password;
            var task_id=msg.task_id|| config.task_id;
            var container_name = msg.jbpmcontainer || config.container_name;
            var DelegateUser_id = msg.DelegateUser_id || config.DelegateUser_id;
            if (validator.isURL(config.url) && !validator.isEmpty(container_name) && !validator.isEmpty(msg.task_id) && !validator.isEmpty(DelegateUser_id) && !validator.isEmpty(user_id) && !validator.isEmpty(password)) {
                config.url = remove_slash(config.url)
                var headers = {
                    'Authorization': 'Basic ' + new Buffer(user_id + ':' + password).toString('base64'),
                    'Content-Type': 'application/json',
                    'X-KIE-ContentType': 'JSON'
                };

                var options = {
                    method: 'PUT',
                    uri: config.url + '/containers/'+container_name+'/tasks/'+task_id+'/states/delegated?targetUser='+DelegateUser_id,
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

    RED.nodes.registerType('delegate-task', getTaskInstanceDetails);
}