var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;
var showMessage = utils.showMessage;
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
            let auth_header = msg.auth_header || "Basic "+new Buffer(user_id + ':' + password).toString('base64');
            let content_type = msg.content_type || config.content_type;
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url) && !validator.isEmpty(container_name) && !validator.isEmpty(process_id)) {
                // show_status(node, 'in_progress')
                url = remove_slash(url)
                var options = {
                    method: 'POST',
                    uri: url + '/containers/' + container_name + '/processes/' + process_id + '/instances/',
                    body: msg.payload,
                    headers: {
                        'Authorization': auth_header,
                        'Content-Type': content_type,
                    },
                    json: true
                }

                request(options, function (error, response, body) {
                    if (error) {
                        showMessage(500, 'Internal server error', error, 'error', error, msg, node);
                    } else {
                        msg.payload = {processInstanceId:response.body};
                        showMessage(response.statusCode,response.statusMessage,msg.payload,'success',false,msg,node);
                    }                    
                    node.send(msg);
                    clear_status(node)
                });
            } else {
                showMessage(500, 'Internal server error', 'Please check authorisation and url'
                    , 'error', 'Please check authorisation and url', msg, node);
            }
        });
    }

    RED.nodes.registerType('create-case', startProcessNaode);
}