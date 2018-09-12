var validator = require('validator');
var utils = require('../utils');
var http = require('http');
var urlPack = require('url');


var clear_status = utils.clear_status;
var remove_slash = utils.remove_slash;
var format_values = utils.format_values;
var showMessage = utils.showMessage;
module.exports = function (RED) {
    function startProcessNaode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var tlsNode = RED.nodes.getNode(config.tls);
        // node
        node.on('input', function (msg) {
            clear_status(node)
            format_values(config)
            let user_id = msg.user_id || config.user_id;
            let password = msg.password || config.password;
            let container_name = msg.container_name || config.container_name;
            let url = msg.url || config.url;
            let process_id = msg.process_id || config.process_id;
            let auth_header = msg.auth_header || "Basic " + new Buffer(user_id + ':' + password).toString('base64');
            let content_type = msg.content_type || config.content_type;
            let httpsValue = msg.tls||config.tls;
            http = require(httpsValue?"https":"http");
            if (!validator.isEmpty(auth_header) && !validator.isEmpty(url) && !validator.isEmpty(container_name) && !validator.isEmpty(process_id)) {
                url = remove_slash(url)
                var options = {
                    method: 'POST',
                    headers: {
                        'Authorization': auth_header,
                        'Content-Type': content_type,
                    }
                }
                
                if(httpsValue){
                    tlsNode.addTLSOptions(options);
                    // options.ca = fs.readFileSync('/home/keith/Downloads/_.isservices.co.za');
                    // tls.checkServerIdentity(host, cert);
                    options.agent = new http.Agent(options);
                }
                options = Object.assign(options,urlPack.parse( url + '/containers/' + container_name + '/processes/' + process_id + '/instances/'));
                // console.log(options);
                var req = http.request(options, function (res) {
                    var buffer = "";
                    res.on("data", function (data) { buffer = buffer + data; });
                    res.on("end", function (data) {
                         msg.payload = buffer;
                         showMessage(res.statusCode, res.statusMessage, msg.payload, 'success', false, msg, node);
                    });
                });
                req.on('error', (e) => {
                    showMessage(500, 'Internal server error', e.message, 'error', e.message, msg, node);
                });
                msg.payload = typeof msg.payload == 'string' ? msg.payload: JSON.stringify(msg.payload);
                req.write(msg.payload);
                req.end();
            } else {
                showMessage(500, 'Internal server error', 'Please check authorisation and url'
                    , 'error', 'Please check authorisation and url', msg, node);
            }
        });
    }

    RED.nodes.registerType('create-case', startProcessNaode);
}