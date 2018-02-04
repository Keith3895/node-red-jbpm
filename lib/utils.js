function show_status(__this, status) {
    var color, text;
    switch (status) {
        case 'success':
            color = 'green';
            text = 'success';
            break;
        case 'error':
            color = 'red';
            text = 'error';
            break;
        default:
            color = 'blue';
            text = 'requesting';
            break;
    }
    return __this.status({
        fill: color,
        shape: 'dot',
        text: text
    });
}

function clear_status(__this) {
    setTimeout(function () {
        return __this.status({});
    }, 1000);
}

function remove_slash(text) {
    if (text.slice(-1) == '/') {
        text = text.slice(0, -1);
    }
    return text;
}

function format_values(object) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            object[key] = typeof object[key] === 'string' ? object[key].trim() : object[key];
        }
    }
    return object;
}
function showMessage(statusCode, statusMessage, payload, show_statusMsg, error, msg ,node) {
    msg.statusCode = statusCode;
    msg.statusMessage = statusMessage;
    msg.payload = payload;
    show_status(node, show_statusMsg)
    if (error)
        node.error(error);
    node.send(msg);
    clear_status(node);
}
module.exports = {
    show_status: show_status,
    clear_status: clear_status,
    remove_slash: remove_slash,
    format_values: format_values,
    showMessage : showMessage
}