'use strict';

// Org controller
app
.controller('SpaceCtrl', ['$rootScope', '$scope', '$stateParams', 'CfService', function($rootScope, $scope, $stateParams, CfService) {

  $rootScope.$broadcast('page-busy');

  CfService.getSpace($stateParams.id).then(function(space) {

    if (space.status == 200) {
      $rootScope.space = space.data;
    }

    CfService.getAppEventsForSpace($stateParams.id).then(function(events) {
      if (events.status == 200) {

        $rootScope.appEvents = events.data.resources;

        $scope.currentPage = 1;
        $scope.pageSize = 10;
      }

      $rootScope.$broadcast('page-loaded');

    });
  });

  $scope.lookupAppFromRootScope = function(appGuid) {
    return _.find($rootScope.space.apps, function(app){ return app.guid == appGuid });
  }

}]);
