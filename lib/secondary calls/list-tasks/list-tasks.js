var request = require("request");
var validator = require('validator');
var utils = require('../utils');
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
            var user_id = msg.user_id || config.user_id;
            var password = msg.password || config.password;
            var Status = msg.Status || config.Status;
            var groups = msg.groups || config.groups;
            var page = msg.page || config.page || '0';
            var pageSize = msg.pageSize || config.pageSize || '5';
            var sortOrder = msg.sortOrder || config.sortOrder || 'true';
            var user = msg.Filter_user_id || config.Filter_user_id || "";
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            if (validator.isURL(config.url) && !validator.isEmpty(groups)) {
                show_status(node, 'in_progress')
                remove_slash(config.url)
                let finalurl = config.url + '/queries/tasks/instances/pot-owners?groups='
                    + groups;
                if (!validator.isEmpty(Status))
                    finalurl += "&status=" + Status;
                if (!validator.isEmpty(user))
                    finalurl += "&user=" + user;
                if (!validator.isEmpty(page))
                    finalurl += "&page=" + page;
                if (!validator.isEmpty(pageSize))
                    finalurl += "&pageSize=" + pageSize;
                if(!validator.isEmpty(sortOrder))
                    finalurl +="&sortOrder="+sortOrder;
                // console.log(finalurl);
                var options = {
                    method: 'GET',
                    uri: finalurl,
                    headers: {
                        'Authorization': 'Basic ' + auth_header,
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
                    catch (e) { node.warn(RED._("httpin.errors.json-error")); }
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