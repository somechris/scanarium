var Greeter = {
    urlParameter: 'greeted',

    init: function() {
        if (!getUrlParameterBoolean(this.urlParameter, false)) {
            MessageManager.addMessage(localize('Welcome to Scanarium!'));
            MessageManager.addMessage(localize('Tap/Click on the middle of the screen to see controls for settings and uploads'));
            setUrlParameterBoolean(this.urlParameter, true);
        }
    },
};
