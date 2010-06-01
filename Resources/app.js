Ti.UI.setBackgroundColor('#fff');

var tabGroup = Ti.UI.createTabGroup();
var mainWin = Ti.UI.createWindow({
    title: 'Labyrinth',
    tabBarHidden: true
});
var mainTab = Ti.UI.createTab({
    icon: '',
    title: 'Labyrinth',
    window: mainWin
});
tabGroup.addTab(mainTab);
tabGroup.open();

var localButton = Ti.UI.createButton({
    title: 'Local',
    top: 50,
    height: 30,
    width: 200
});
mainWin.add(localButton);
localButton.addEventListener('click', function(){
    var gameWin = Ti.UI.createWindow({
        tabBarHidden: true
    });
    var webview = Ti.UI.createWebView({
        url: 'test/demo.html'
    });
    gameWin.add(webview);
    mainTab.open(gameWin);
});

var remoteButton = Ti.UI.createButton({
    title: 'Remote',
    top: 100,
    height: 30,
    width: 200
});
mainWin.add(remoteButton);
remoteButton.addEventListener('click', function(){
    var baseUrl = 'http://79.99.1.153/labyrinth/Resources/';
    var xhr = Ti.Network.createHTTPClient();
    xhr.onload = function(){
        var gameWin = Ti.UI.createWindow({
            tabBarHidden: true
        });
        
        var html = this.responseText.replace(/(src|href)="\.\.\/(.*?)\"/g, '$1="' + baseUrl + '$2"');
        var webview = Ti.UI.createWebView({
            html: html
        });
        gameWin.add(webview);
        mainTab.open(gameWin);
    }
    
    xhr.open('GET', 'http://79.99.1.153/labyrinth/Resources/test/demo.html');
    xhr.send();
});




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
