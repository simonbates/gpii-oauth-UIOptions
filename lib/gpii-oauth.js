"use strict";
var fluid = require("infusion"),
    path = require("path"),
    contentDir = path.resolve(__dirname, "../content"),
    gpii = fluid.registerNamespace("gpii"),
    passport = require('passport'),
    OAuth2Strategy = require("passport-oauth").OAuth2Strategy, 
    preferences = require('./preferences.js');
 
console.log("Content: "+ contentDir);
fluid.setLogging(true);

require("gpii-express");

fluid.registerNamespace("gpii.oauth.client");

gpii.oauth.client.initializePassport = function (that) {
 
    passport.use("UIOptions", new OAuth2Strategy({
        authorizationURL: "http://" + that.options.config.oauth.provider.host + "/authorize",
        tokenURL: "http://" + that.options.config.oauth.provider.host + "/access_token",
        clientID: that.options.config.oauth.clientId,
        clientSecret: that.options.config.oauth.clientSecret,
        callbackURL: "http://localhost:8000/callback"
      },
      function (accessToken, refreshToken, profile, done) {
        done(null, { accessToken: accessToken });   
      }
    ));    
    passport.serializeUser(function(preferences, done) {
      done(null, preferences);
    });
  
    passport.deserializeUser(function(preferences, done) {
      done(null, preferences);
    });
 
    that.express.use(passport.initialize());
    that.express.use(passport.session());
    that.passport = passport; 
    
}


fluid.defaults("gpii.oauth.client",{
    gradeNames: ["gpii.express", "autoInit"],
    passport: null,
    config: {                                                                                            
        express: {                                                                                      
            port: 8000,
            baseUrl: "http://localhost:8000",                                                            
            session: {
                secret: "shhhh_secret_string"
            }
        },
        oauth: {
            clientId: "org.rtf.UIOptions",
            clientSecret: "secretUIOptions",
            provider: {
                protocol: "http",
                host: "localhost:8081",
                authPath: "/authorize",
                tokenPath: "/access_token"
            },
            consumer: {
                protocol: "http",
                host: "localhost:8000",
                callbackPath: "/callback"
            }
        }
    },                                                                                                  
    listeners: {
        onCreate: {
            funcName: "gpii.oauth.client.initializePassport",
            args:   ["{that}"]
        }
    },
    components: {                                                                                        
        session: {
            type: "gpii.express.middleware.session"
        },
        staticContent: {
            type: "gpii.express.router.static",
            options: {
                path: "/",
                content: contentDir
            }
        },
        routePreferences: {
            type: "gpii.oauth.client.routePreferences",
            options: {
                oauthConfig: "{that}.config.oauth"
            }
        },
        routeCallback: {
            type: "gpii.oauth.client.routeCallback",
            options: {
                oauthConfig: "{that}.config.oauth"
            }
        }
    } 
});

fluid.registerNamespace("gpii.oauth.client.routePreferences");

gpii.oauth.client.routePreferences.getRouter = function () {
     return passport.authenticate('UIOptions', { scope: 'scope_1' });
};

fluid.defaults("gpii.oauth.client.routePreferences",{
    gradeNames: ["gpii.express.router", "autoInit"],
    method: "get",
    path: "/preferences",
    invokers: {
        "getRouter": {
            funcName: "gpii.oauth.client.routePreferences.getRouter",
            args: ["{that}"]
        }
    }
});

fluid.registerNamespace("gpii.oauth.client.routeCallback");

gpii.oauth.client.routeCallback.getRouter = function () {
     return passport.authenticate('UIOptions', { failureRedirect: '/close.html?error=foo'}); 
};

fluid.defaults("gpii.oauth.client.routeCallback", {
    gradeNames: ["gpii.express.router", "autoInit"],
    method: "get",
    path: "/callback",
    invokers: {
        "getRouter": {
            funcName: "gpii.oauth.client.routeCallback.getRouter",
            args: ["{that}"]
        }
    }
});

gpii.oauth.client();
