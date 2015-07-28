'use strict';

angular.module('app')
  .factory('CfService', function ($http, Session, $cookies) {

    return {

      findLoginHost: function(host) {
        var _self = this;

        return $http
        .get("https://" + host + "/v2/info")
        .then(function (res) {
          _self.loggingEndpoint = res.data.logging_endpoint;
          return res.data.authorization_endpoint
        });
      },

      isAuthenticated: function() {

        var _self = this;
        var cfHost = $cookies.CF_HOST;

        if (this.loggingEndpoint == undefined && cfHost != undefined) this.findLoginHost(cfHost);

        _self.tokenExpiresIn = $cookies.CF_TOKEN_EXPIRES_IN;

        if (Date.now() > _self.tokenExpiresIn) this.refreshOldToken().then(function(data){
          console.log(data);
        });

        _self.cfHost = $cookies.CF_HOST;
        _self.accessToken = $cookies.CF_ACCESS_TOKEN;
        _self.accessTokenType = $cookies.CF_ACCESS_TOKEN_TYPE;
        _self.refreshToken = $cookies.CF_REFRESH_TOKEN;
        _self.tokenExpiresIn = $cookies.CF_TOKEN_EXPIRES_IN;

        return Date.now() < _self.tokenExpiresIn;
      },
      logout: function () {
          delete $cookies.CF_HOST;
          delete $cookies.CF_ACCESS_TOKEN;
          delete $cookies.CF_ACCESS_TOKEN_TYPE;
          delete $cookies.CF_REFRESH_TOKEN;
          delete $cookies.CF_TOKEN_EXPIRES_IN;

          return(!this.isAuthenticated());
      },
      login: function (credentials, authEndpoint) {
        this.cfHost = credentials.endpoint;
        this.authEndpoint = authEndpoint;
        var username = credentials.username;
        var password = credentials.password;
        var _self = this;

        return $http({
          method: 'POST',
          url: authEndpoint + "/oauth/token",
          data: "grant_type=password&password=" + password + "&username=" + username,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'Authorization': 'Basic Y2Y6'
          }
        })
        .error(function(data, status, headers, config) {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          data.status = status;
          return data;
        })
        .then(function (authRes) {
          _self.updateAuthData(authRes);
          return authRes;
        })
      },

      getOrgs: function() {
        return this.curl('GET', '/v2/organizations', null);
      },

      getOrg: function(orgId) {
        return this.curl('GET', '/v2/organizations/' + orgId, null);
      },

      getSpaces: function(orgId) {
        return this.curl('GET', '/v2/organizations/' + orgId + '/spaces', null);
      },

      getSpace: function(spaceId) {
        return this.curl('GET', '/v2/spaces/' + spaceId + "/summary", null);
      },

      getAppsForSpace: function(spaceId) {
        return this.curl('GET', '/v2/spaces/' + spaceId + "/apps", null);
      },

      getAppEventsForSpace: function(spaceId) {
        return this.curl('GET', '/v2/spaces/' + spaceId + "/app_events", null);
      },

      getServices: function(spaceId) {
        return this.curl('GET', '/v2/spaces/' + spaceId + "/service_instances", null);
      },

      getApplication: function(applicationId) {
        return this.curl('GET', '/v2/apps/' + applicationId, null);
      },

      getApplicationStats: function(applicationId) {
        return this.curl('GET', '/v2/apps/' + applicationId + '/stats', null);
      },

      curl: function (method, url, body) {

        var authenticated = this.isAuthenticated();

        return $http({
          method: method,
          url: 'https://' + this.cfHost + url,
          data: body,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
            'Authorization': this.accessTokenType + ' ' + this.accessToken
          }
        });

      },

      refreshOldToken: function (){

        var _self = this;

        return this.findLoginHost(this.cfHost)
        .then(function(authHost) {

          return $http({
            method: 'POST',
            url: authHost + "/oauth/token",
            data: "grant_type=refresh_token&refresh_token=" + _self.refreshToken,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
              'Authorization': 'Basic Y2Y6'
            }
          })
          .error(function(data, status, headers, config) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            data.status = status;
            return data;
          })
          .then(function (authRes) {
            console.log("!!!UPDATED ACCESS TOKEN!!!");
            _self.updateAuthData(authRes);

            return authRes;
          })

        });
      },
      updateAuthData: function (authRes) {

        $cookies.CF_HOST = this.cfHost;
        this.accessToken = $cookies.CF_ACCESS_TOKEN = authRes.data.access_token;
        this.accessTokenType = $cookies.CF_ACCESS_TOKEN_TYPE = authRes.data.token_type;
        this.refreshToken = $cookies.CF_REFRESH_TOKEN = authRes.data.refresh_token;
        this.tokenExpiresIn = $cookies.CF_TOKEN_EXPIRES_IN = Date.now() + (authRes.data.expires_in * 1000);

      }
    };
  })
