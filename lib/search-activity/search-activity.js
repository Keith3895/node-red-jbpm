var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var show_status = utils.show_status;
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;

module.exports = function (RED) {
    function startTaskNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            clear_status(node)
            format_values(msg);
            format_values(config);
            let url = msg.url || config.url;
            let user_id = msg.jbpmuser || config.user_id;
            let password = msg.jbpmpassword || config.password;
            let container_name = msg.jbpmcontainer || config.container_name;
            let method = msg.method || config.method;
            let process_instance_id = msg.process_instance_id || config.process_instance_id;
            let variableName = msg.variableName || config.variableName;
            let variableVal = msg.variableVal || config.variableVal;
            let auth_header = msg.auth_header || new Buffer(user_id + ':' + password).toString('base64');
            let Status = msg.Status || config.Status || "";
            let page = msg.page || config.page || '0';
            let pageSize = msg.pageSize || config.pageSize || '5';
            let sortOrder = msg.sortOrder || config.sortOrder || 'true';
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url)) {
                show_status(node, 'in_progress');
                switch (method) {
                    case 'workitem':
                    console.log("inside case");
                        workitem(url, container_name, process_instance_id, auth_header,msg);
                        break;
                    case 'task':
                        task(url,process_instance_id,auth_header,Status,page,pageSize,sortOrder,msg);
                        break;
                    case 'query':
                        query(url,variableName,variableVal,auth_header,Status,page,pageSize,sortOrder,msg);
                        break;
                    default:
                        msg.statusMessage = 'Search activity error';
                        msg.payload = 'Please check method';
                        show_status(node, 'error')
                        node.error('Please check method');
                        node.send(msg);
                        clear_status(node);
                }
            } else {
                msg.statusMessage = 'Search activity error';
                msg.payload = 'Please check url of user credentials';
                show_status(node, 'error')
                node.error('Please check url of user credentials');
                node.send(msg);
                clear_status(node);
            }
            
        });
        function workitem(url, container_name, process_instance_id, auth_header,msg) {
            
            url = remove_slash(url);
            var options = {
                method: 'get',
                uri: url + '/containers/' + container_name + '/processes/instances/' + process_instance_id + '/workitems/',
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
        }
        function task(url,process_instance_id,auth_header,Status,page,pageSize,sortOrder,msg) {
            
            url = remove_slash(url);
            let finalurl = url+'/queries/tasks/instances/process/' + process_instance_id+"?";
                if (!validator.isEmpty(Status))
                    finalurl += "&status=" + Status;
                if (!validator.isEmpty(page))
                    finalurl += "&page=" + page;
                if (!validator.isEmpty(pageSize))
                    finalurl += "&pageSize=" + pageSize;
                if(!validator.isEmpty(sortOrder))
                    finalurl +="&sortOrder="+sortOrder;
                console.log(finalurl);
            var options = {
                method: 'get',
                uri: finalurl,
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
        }
        function query(url,variableName,variableVal,auth_header,Status,page,pageSize,sortOrder,msg) {
            
            url = remove_slash(url);
            let finalurl = url+'/queries/processes/instances/variables/'+variableName+"?varValue="+variableVal;
                if (!validator.isEmpty(Status))
                    finalurl += "&status=" + Status;
                if (!validator.isEmpty(page))
                    finalurl += "&page=" + page;
                if (!validator.isEmpty(pageSize))
                    finalurl += "&pageSize=" + pageSize;
                if(!validator.isEmpty(sortOrder))
                    finalurl +="&sortOrder="+sortOrder;
                console.log(finalurl);
            var options = {
                method: 'get',
                uri: finalurl,
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
        }
        
    }

    RED.nodes.registerType('search-activity', startTaskNode);
}