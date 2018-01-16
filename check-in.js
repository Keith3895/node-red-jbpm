module.exports = function(RED) {
    function checkInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function(msg) {
            msg.payload = config;
            node.send(msg);
        });
    }
    RED.nodes.registerType('check-in', checkInNode);
}