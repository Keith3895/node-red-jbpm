var request = require("request");
var validator = require('validator');
var utils = require('../utils');
var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;
var showMessage = utils.showMessage;
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
            let content_type = msg.content_type || config.content_type;
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url)) {
                // show_status(node, 'in_progress');
                switch (method) {
                    case 'workitem':
                    console.log("inside case");
                        workitem(url,content_type, container_name, process_instance_id, auth_header,msg);
                        break;
                    case 'task':
                        task(url,content_type,process_instance_id,auth_header,Status,page,pageSize,sortOrder,msg);
                        break;
                    case 'query':
                        query(url,content_type,variableName,variableVal,auth_header,Status,page,pageSize,sortOrder,msg);
                        break;
                    default:
                    showMessage(500, 'Search activity error', 'Please check method', 'error', 'Please check method', msg, node);
                }
            } else {
                showMessage(500, 'Search activity error', 'Please check url of user credentials'
                , 'error', 'Please check url of user credentials', msg, node);
            }
            
        });
        function workitem(url,content_type, container_name, process_instance_id, auth_header,msg) {
            
            url = remove_slash(url);
            var options = {
                method: 'get',
                uri: url + '/containers/' + container_name + '/processes/instances/' + process_instance_id + '/workitems/',
                headers: {
                    'Authorization': 'Basic ' + auth_header,
                    'Content-Type': content_type,
                },
                json: true
            }
            request(options, function (error, response, body) {
                if (error) {
                    showMessage(500, 'Internal server error', error, 'error', error, msg, node,node);
                } else {
                    showMessage(response.statusCode,response.statusMessage,response.body,'success',false,msg,node);
                }
            });
        }
        function task(url,content_type,process_instance_id,auth_header,Status,page,pageSize,sortOrder,msg) {
            
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
                    'Content-Type': content_type,
                },
                json: true
            }
            request(options, function (error, response, body) {
                if (error) {
                    showMessage(500, 'Internal server error', error, 'error', error, msg, node);
                } else {
                    showMessage(response.statusCode,response.statusMessage,response.body,'success',false,msg,node);
                }
            });
        }
        function query(url,content_type,variableName,variableVal,auth_header,Status,page,pageSize,sortOrder,msg) {
            
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
                    'Content-Type': content_type,
                },
                json: true
            }
            request(options, function (error, response, body) {
                if (error) {
                    showMessage(500, 'Internal server error', error, 'error', error, msg, node);
                } else {
                    showMessage(response.statusCode,response.statusMessage,response.body,'success',false,msg,node);
                }
            });
        }
        
        
    }

    RED.nodes.registerType('search-activity', startTaskNode);
}