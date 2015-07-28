'use strict';

// Org controller

app.filter('partition', function($cacheFactory) {
  var arrayCache = $cacheFactory('partition');
  var filter = function(arr, size) {
    var newArr = [];
    for (var i=0; i<arr.length; i+=size) {
        newArr.push(arr.slice(i, i+size));
    }
    var cachedParts;
    var arrString = JSON.stringify(arr);
    cachedParts = arrayCache.get(arrString+size);
    if (JSON.stringify(cachedParts) === JSON.stringify(newArr)) {
      return cachedParts;
    }
    arrayCache.put(arrString+size, newArr);
    return newArr;
  };
  return filter;
});

app.controller('OrganizationCtrl', ['$rootScope', '$scope', '$stateParams', 'CfService', function($rootScope, $scope, $stateParams, CfService) {

  $rootScope.$broadcast('page-busy');

  $rootScope.spaceDetails = [];

  CfService.getOrg($stateParams.id).then(function(org) {
    if (org.status == 200) {
      $rootScope.org = org.data;

      CfService.getSpaces($stateParams.id).then(function(spaces) {

        if (spaces.status == 200) {
          $rootScope.spaces = spaces.data.resources;

          _.each(spaces.data.resources, function(space) {

            CfService.getSpace(space.metadata.guid).then(function(spaceSummary) {
              if (spaceSummary.status == 200) {

                _.each(spaceSummary.data.apps, function(app) {

                  CfService.getApplicationStats(app.guid).then(function(appStats) {
                    if (appStats.status == 200) {
                      app.stats = appStats.data;
                    }
                  });

                });

                if (spaceSummary.data.guid == _.last(spaces.data.resources).metadata.guid) $rootScope.$broadcast('page-loaded');
                if (spaceSummary.data.apps.length > 0) $rootScope.spaceDetails.push(spaceSummary.data);
              }
            });

          });
        }


      });

    }
  });


}]);
