// A simple implementation of "printf" 
// Got this example here: 
// https://htmler.ru/2015/05/09/javascript-printf-javascript-sprintf-javascript-print/

String.prototype.printf = function() {
    var formatted = this;
    for( var arg in arguments ) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};
