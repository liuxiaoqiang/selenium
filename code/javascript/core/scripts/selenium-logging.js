/*
 * Copyright 2004 ThoughtWorks, Inc
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

var Logger = function() {
    this.logWindow = null;
}
Logger.prototype = {

    pendingMessages: new Array(),

    setLogLevelThreshold: function(logLevel) {
        this.pendingLogLevelThreshold = logLevel;
        this.show();
        // NOTE: log messages will be discarded until the log window is
        // fully loaded.
    },

    getLogWindow: function() {
        if (this.logWindow && this.logWindow.closed) {
            this.logWindow = null;
        }
        if (this.logWindow && this.pendingLogLevelThreshold && this.logWindow.setThresholdLevel) {
            this.logWindow.setThresholdLevel(this.pendingLogLevelThreshold);
            
            // can't just directly log because that action would loop back
            // to this code infinitely
            var pendingMessage = new LogMessage("info", "Log level programmatically set to " + this.pendingLogLevelThreshold + " (presumably by driven-mode test code)");
            this.pendingMessages.push(pendingMessage);
            
            this.pendingLogLevelThreshold = null;    // let's only go this way one time
        }

        return this.logWindow;
    },
    
    openLogWindow: function() {
        this.logWindow = window.open(
            getDocumentBase(document) + "SeleniumLog.html", "SeleniumLog",
            "width=600,height=1000,bottom=0,right=0,status,scrollbars,resizable"
        );
        this.logWindow.moveTo(window.screenX + 1210, window.screenY + window.outerHeight - 1400);
        if (browserVersion.appearsToBeBrokenInitialIE6) {
	// I would really prefer for the message to immediately appear in the log window, the instant the user requests that the log window be 
        	// visible.  But when I initially coded it this way, thou message simply didn't appear unless I stepped through the code with a debugger.  
        	// So obviously there is some timing issue here which I don't have the patience to figure out.
        	var pendingMessage = new LogMessage("warn", "You appear to be running an unpatched IE 6, which is not stable and can crash due to memory problems.  We recommend you run Windows update to install a more stable version of IE.");
            this.pendingMessages.push(pendingMessage);
        }
        return this.logWindow;
    },
    
    show: function() {
        if (! this.getLogWindow()) {
            this.openLogWindow();
        }
    },

    logHook: function(message, className) {
    },

    log: function(message, className) {
        var logWindow = this.getLogWindow();
        this.logHook(message, className);
        if (logWindow) {
            if (logWindow.append) {
                if (this.pendingMessages.length > 0) {
                    logWindow.append("info: Appending missed logging messages", "info");
                    while (this.pendingMessages.length > 0) {
                        var msg = this.pendingMessages.shift();
                        logWindow.append(msg.type + ": " + msg.msg, msg.type);
                    }
                    logWindow.append("info: Done appending missed logging messages", "info");
                }
                logWindow.append(className + ": " + message, className);
            }
        } else {
            // uncomment this to turn on background logging
            /* these logging messages are never flushed, which creates 
               an enormous array of strings that never stops growing.  Only
               turn this on if you need it for debugging! */
            //this.pendingMessages.push(new LogMessage(className, message));
        }
    },

    close: function(message) {
        if (this.logWindow != null) {
            try {
                this.logWindow.close();
            } catch (e) {
                // swallow exception
                // the window is probably closed if we get an exception here
            }
            this.logWindow = null;
        }
    },

    debug: function(message) {
       this.log("debug", message);
    },

    info: function(message) {
       this.log("info", message);
    },

    warn: function(message) {
       this.log("warn", message);
    },

    error: function(message) {
       this.log("error", message);
    },

    exception: function(exception) {
        var msg = "Unexpected Exception: " + describe(exception, ', ');
        this.error(msg);
    }

};

var LOG = new Logger();

var LogMessage = function(type, msg) {
    this.type = type;
    this.msg = msg;
}
