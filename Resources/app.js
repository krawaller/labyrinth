Ti.UI.setBackgroundColor('#000');

var mainWin = Ti.UI.createWindow();

var baseUrl = 'http://79.99.1.153/labyrinth/Resources/';

var xhr = Ti.Network.createHTTPClient();
xhr.onload = function(){
    var html = this.responseText.replace(/(src|href)="\.\.\/(.*?)\"/g, '$1="' + baseUrl + '$2"');
    Ti.API.info(html);
    var webview = Ti.UI.createWebView({
        html: html
    });
    mainWin.add(webview);
    mainWin.open();
}

xhr.open('GET', 'http://79.99.1.153/labyrinth/Resources/test/demo.html');
xhr.send();

var threshold = 0.25;
Ti.Accelerometer.addEventListener('update', function(e){
    // Should normalize values
    var move;
    if(e.x < -threshold){
        move = 4;
    } else if(e.x > threshold){
        move = 2;
    } else if(e.y < -threshold){
        move = 1;
    } else if(e.y > threshold){
        move = 3;
    }
    if (move) {
        Ti.App.fireEvent('move', { dir: move });
    }
    
});
