angular.module('app')
  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
  })
  .constant('USER_ROLES', {
    all: '*',
    admin: 'admin',
    editor: 'editor',
    guest: 'guest'
  })
  .factory('AuthService', function ($http, Session, CfService, USER_ROLES) {
    var authService = {};

    authService.login = function (credentials) {
      return CfService.findLoginHost(credentials.endpoint)
        .then(function(host) {
          return CfService.login(credentials, host)
            .then(function (auth) {
              if (auth.status == 200) {
                Session.create(credentials.username, auth.data.access_token, auth.data.token_type, 'guest');
                return {username: credentials.username, access_token: auth.data.access_token, token_type: auth.data.token_type, endpoint: credentials.endpoint};
              } else {
                return auth;
              }
           })
        })
    };

    authService.logout = function() {
      return CfService.logout();
    };

    authService.isAuthenticated = function () {
      return CfService.isAuthenticated();
      // return !!Session.userId;
    };

    authService.isAuthorized = function (authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      return (authService.isAuthenticated() &&
        (authorizedRoles.indexOf(Session.userRole) > -1 || authorizedRoles.indexOf(USER_ROLES.all.valueOf()) > -1));
    };

    return authService;
  })
  .service('Session', function () {
    this.create = function (userId, accessToken, tokenType, userRole) {
      this.userId = userId;
      this.accessToken = accessToken;
      this.tokenType = tokenType;
      this.userRole = userRole;
    };
    this.destroy = function () {
      this.userId = null;
      this.accessToken = null;
      this.tokenType = null;
      this.userRole = null;
    };
    return this;
  })
  .run(function ($rootScope, AUTH_EVENTS, AuthService, $state) {
    $rootScope.$on('$stateChangeStart', function (event, next) {
      var authData = next.data || { authorizedRoles: [] }
      var authorizedRoles = authData.authorizedRoles;

      if (authorizedRoles.length == 0) return;

      if (!AuthService.isAuthorized(authorizedRoles)) {
        event.preventDefault();
        if (AuthService.isAuthenticated()) {
          // user is not allowed
          $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
        } else {
          // user is not logged in
          $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
        }
      }

    });

    $rootScope.$on(AUTH_EVENTS.notAuthenticated, function(event, next ) {
      $state.go('access.signin');
    });

  })
  // .config(function ($httpProvider) {
  //   $httpProvider.interceptors.push([
  //     '$injector',
  //     function ($injector) {
  //       return $injector.get('AuthInterceptor');
  //     }
  //   ]);
  // })
  // .factory('AuthInterceptor', function ($rootScope, $q,
  //                                       AUTH_EVENTS) {
  //   return {
  //     responseError: function (response) {
  //       $rootScope.$broadcast({
  //         401: AUTH_EVENTS.notAuthenticated,
  //         403: AUTH_EVENTS.notAuthorized,
  //         419: AUTH_EVENTS.sessionTimeout,
  //         440: AUTH_EVENTS.sessionTimeout
  //       }[response.status], response);
  //       return $q.reject(response);
  //     }
  //   };
  // })
