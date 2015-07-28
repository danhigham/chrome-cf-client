'use strict';

// Org controller

app.controller('ApplicationCtrl', ['$rootScope', '$scope', '$interval', '$stateParams', 'CfService', function($rootScope, $scope, $interval, $stateParams, CfService) {

  $scope.logs = "";

  $rootScope.$broadcast('page-busy');

  var instances = 0;
  var chartWidth = 5; //minutes
  var pollInterval = 3; //seconds

  var n = (chartWidth * 60) / pollInterval;

  $scope.usageData = [];

  CfService.getApplication($stateParams.id).then(function(application) {
    if (application.status == 200) {
      $rootScope.application = application.data;
      
      CfService.getSpace(application.data.entity.space_guid).then(function(space) {
        if (space.status == 200) {
          $rootScope.space = space.data;
          $rootScope.$broadcast('page-loaded');
        }
      });

      $scope.instances = instances = application.data.entity.instances;
      initChartData();
    }
  });

  var ws = new WebSocket('wss://log-proxy.cfapps.io:4443/');
  //var ws = new WebSocket('ws://localhost:4443/');

  ws.onmessage = function (event) {
    var m = JSON.parse(event.data);

    if (m.Guid != undefined) {
      ws.send(JSON.stringify({
        LogEndPoint:    CfService.loggingEndpoint,
        AccessToken:    CfService.accessToken,
        TokenType:      CfService.accessTokenType,
        AppId:          $stateParams.id,
        ConnectionGuid: m.Guid
      }));
    } else {
      var logLine = m.source_name + " " + m.message_type + " " + atob(m.message);

      $scope.logs += logLine.replace(/(\r\n|\n|\r)/gm,"") + "\n";
      $scope.$digest();
    }
  };

  var parseDate = d3.time.format.utc("%Y-%m-%d %H:%M:%S +0000").parse;

  var statsPoll = $interval(function() {
    CfService.getApplicationStats($stateParams.id).then(function(appUsage) {
      if (appUsage.status == 200) {

        $scope.usageData.shift();

        var newVal = { };

        for (var k = 0; k < instances; k++) {
          newVal.date = parseDate(appUsage.data[k].stats.usage.time);
          newVal["cpu_" + k] = appUsage.data[k].stats.usage.cpu * 100;
          newVal["mem_" + k] = appUsage.data[k].stats.usage.mem;
        }

        $scope.usageData.push(newVal);
      }
    });

  }, pollInterval * 1000);

  $scope.$on('$destroy', function() {
    $interval.cancel(statsPoll);
    ws.close();
  });

  function initChartData() {

    var data = []

    var first = Date.now() - (n * pollInterval * 1000);

    $scope.usageData = d3.range(n).map(function(y) {

      var retval = { date: new Date(first + (y * pollInterval * 1000)) }

      for (var k = 0; k < instances; k++) {
        retval["cpu_" + k] = 0;
        retval["mem_" + k] = 0;
      }

      return retval;
    });

  }

}]);
