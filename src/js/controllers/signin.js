'use strict';

/* Controllers */
  // signin controller
app.controller('SigninFormController', ['$scope', '$http', '$state', '$rootScope', 'AuthService', 'AUTH_EVENTS',
  function($scope, $http, $state, $rootScope, AuthService, AUTH_EVENTS) {
    AuthService.logout();

    $scope.authError = null;

    $scope.credentials = {
      endpoint: 'api.run.pivotal.io',
      username: '',
      password: ''
    };

    $scope.login = function() {
      $rootScope.$broadcast('page-busy');

      AuthService.login($scope.credentials).then(function (user) {
        $rootScope.setCurrentUser(user);
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
        $rootScope.$broadcast('page-loaded');
      }, function (error) {
        $scope.authError = error.data.error_description || "An unknown error has occured. Check connection.";
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
        $rootScope.$broadcast('page-loaded');
      });
    };
  }]
);
