var http = require('http');
var urlPack = require('url');
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
        var tlsNode = RED.nodes.getNode(config.tls);
        this.on('input', function (msg) {
            clear_status(node)
            format_values(msg);
            format_values(config);
            let url = msg.url || config.url;
            let user_id = msg.user_id || config.user_id;
            let password = msg.password || config.password;
            let container_name = msg.container_name || config.container_name;
            let method = msg.method || config.method;
            let process_instance_id = msg.process_instance_id || config.process_instance_id;
            let variableName = msg.variableName || config.variableName;
            let variableVal = msg.variableVal || config.variableVal;
            let auth_header = msg.auth_header || "Basic " + new Buffer(user_id + ':' + password).toString('base64');
            let Status = msg.Status || config.Status || "";
            let page = msg.page || config.page || '0';
            let pageSize = msg.pageSize || config.pageSize || '5';
            let sortOrder = msg.sortOrder || config.sortOrder || 'true';
            let content_type = msg.content_type || config.content_type;
            let httpsValue = msg.tls||config.tls;
            msg.tls = httpsValue;
            http = require(httpsValue?"https":"http");
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url)) {
                // show_status(node, 'in_progress');
                // console.log(method);
                switch (method) {
                    case 'workitem':
                        
                        workitem(url, content_type, container_name, process_instance_id, auth_header, msg);
                        break;
                    case 'task':
                        task(url, content_type, process_instance_id, auth_header, Status, page, pageSize, sortOrder, msg);
                        break;
                    case 'query':
                        query(url, content_type, variableName, variableVal, auth_header, Status, page, pageSize, sortOrder, msg);
                        break;
                    default:
                        showMessage(500, 'Search activity error', 'Please check method', 'error', 'Please check method', msg, node);
                }
            } else {
                showMessage(500, 'Search activity error', 'Please check url of user credentials'
                    , 'error', 'Please check url of user credentials', msg, node);
            }

        });
        function workitem(url, content_type, container_name, process_instance_id, auth_header, msg) {
            url = remove_slash(url);
            var headers = {
                'Authorization': auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'GET',
                headers: headers
            };
            url += '/containers/' + container_name + '/processes/instances/' + process_instance_id + '/workitems/';
            url = urlPack.parse(url);
            
            if(msg.tls){
                tlsNode.addTLSOptions(options);
                // options.ca = fs.readFileSync('/home/keith/Downloads/_.isservices.co.za');
                // tls.checkServerIdentity(host, cert);
                options.agent = new http.Agent(options);
            }
            options = Object.assign(options, url);
            var req = http.request(options, function (res) {
                var buffer = "";
                res.on("data", function (data) { buffer = buffer + data; });
                res.on("end", function (data) {
                    msg.payload = buffer;
                    try { msg.payload = JSON.parse(msg.payload); } // obj
                    catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    // console.log(msg.payload);
                    showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                });
            });
            req.on('error', (e) => {
                showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
            });
            req.end();
        }
        function task(url, content_type, process_instance_id, auth_header, Status, page, pageSize, sortOrder, msg) {

            url = remove_slash(url);
            let finalurl = url + '/queries/tasks/instances/process/' + process_instance_id + "?";
            if (!validator.isEmpty(Status))
                finalurl += "&status=" + Status;
            if (!validator.isEmpty(page))
                finalurl += "&page=" + page;
            if (!validator.isEmpty(pageSize))
                finalurl += "&pageSize=" + pageSize;
            if (!validator.isEmpty(sortOrder))
                finalurl += "&sortOrder=" + sortOrder;
            
            var headers = {
                'Authorization': auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'GET',
                headers: headers,
            };
            url = urlPack.parse(finalurl);
            
            if(msg.tls){
                tlsNode.addTLSOptions(options);
                // options.ca = fs.readFileSync('/home/keith/Downloads/_.isservices.co.za');
                // tls.checkServerIdentity(host, cert);
                options.agent = new http.Agent(options);
            }
            options = Object.assign(options, url);
            // console.log(options);
            var req = http.request(options, function (res) {
                var buffer = "";
                res.on("data", function (data) { buffer = buffer + data; });
                res.on("end", function (data) {
                    msg.payload = buffer;
                    try { msg.payload = JSON.parse(msg.payload); } // obj
                                catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                });
            });
            req.on('error', (e) => {
                showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
            });
            req.end();
        }
        function query(url, content_type, variableName, variableVal, auth_header, Status, page, pageSize, sortOrder, msg) {

            url = remove_slash(url);
            let finalurl = url + '/queries/processes/instances/variables/' + variableName + "?varValue=" + variableVal;
            if (!validator.isEmpty(Status))
                finalurl += "&status=" + Status;
            if (!validator.isEmpty(page))
                finalurl += "&page=" + page;
            if (!validator.isEmpty(pageSize))
                finalurl += "&pageSize=" + pageSize;
            if (!validator.isEmpty(sortOrder))
                finalurl += "&sortOrder=" + sortOrder;
            var headers = {
                'Authorization': auth_header,
                'Content-Type': content_type,
            };

            var options = {
                method: 'GET',
                headers: headers,
            };
            url = urlPack.parse(finalurl);
            
            if(msg.tls){
                tlsNode.addTLSOptions(options);
                // options.ca = fs.readFileSync('/home/keith/Downloads/_.isservices.co.za');
                // tls.checkServerIdentity(host, cert);
                options.agent = new http.Agent(options);
            }
            options = Object.assign(options, url);
            var req = http.request(options, function (res) {
                var buffer = "";
                res.on("data", function (data) { buffer = buffer + data; });
                res.on("end", function (data) {
                    msg.payload = buffer;
                    try { msg.payload = JSON.parse(msg.payload); } // obj
                    catch(e) { node.warn(RED._("httpin.errors.json-error")); }
                    showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                });
            });
            req.on('error', (e) => {
                showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
            });
            req.end();
        }


    }

    RED.nodes.registerType('search-activity', startTaskNode);
}