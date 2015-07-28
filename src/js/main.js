'use strict';

/* Controllers */

angular.module('app')
  .controller('AppCtrl', ['$scope', '$state', '$rootScope', '$translate', '$localStorage', '$window', 'USER_ROLES', 'CfService', 'AuthService', 'AUTH_EVENTS',
    function(              $scope,   $state,   $rootScope,   $translate,   $localStorage,   $window,   USER_ROLES,   CfService,   AuthService,   AUTH_EVENTS) {
      // add 'ie' classes to html
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      isIE && angular.element($window.document.body).addClass('ie');
      isSmartDevice( $window ) && angular.element($window.document.body).addClass('smart');

      window.cfservice = CfService;

      // config
      $scope.app = {
        name: 'Cloud Foundry Community Dashboard',
        version: '0.1',
        // for chart colors
        color: {
          primary: '#7266ba',
          info:    '#23b7e5',
          success: '#27c24c',
          warning: '#fad733',
          danger:  '#f05050',
          light:   '#e8eff0',
          dark:    '#3a3f51',
          black:   '#1c2b36'
        },
        settings: {
          themeID: 1,
          navbarHeaderColor: 'bg-black',
          navbarCollapseColor: 'bg-white-only',
          asideColor: 'bg-black',
          headerFixed: true,
          asideFixed: false,
          asideFolded: false,
          asideDock: false,
          container: false
        }
      }

      //authentication
      $rootScope.currentUser = null;
      $rootScope.userRoles = USER_ROLES;
      $rootScope.isAuthorized = AuthService.isAuthorized;

      $rootScope.setCurrentUser = function (user) {
        $rootScope.currentUser = user;
      };

      // load orgs and spaces on succesful login
      $rootScope.$on(AUTH_EVENTS.loginSuccess, function(event, next ) {
        loadOrgs();

        $state.go('app.dashboard-v2');
      });

      if(CfService.isAuthenticated()) {
        // var user = $rootScope.currentUser;
        loadOrgs();
      };

      // save settings to local storage
      if ( angular.isDefined($localStorage.settings) ) {
        $scope.app.settings = $localStorage.settings;
      } else {
        $localStorage.settings = $scope.app.settings;
      }
      $scope.$watch('app.settings', function(){
        if( $scope.app.settings.asideDock  &&  $scope.app.settings.asideFixed ){
          // aside dock and fixed must set the header fixed.
          $scope.app.settings.headerFixed = true;
        }
        // save to local storage
        $localStorage.settings = $scope.app.settings;
      }, true);

      // angular translate
      $scope.lang = { isopen: false };
      $scope.langs = {en:'English', de_DE:'German', it_IT:'Italian'};
      $scope.selectLang = $scope.langs[$translate.proposedLanguage()] || "English";
      $scope.setLang = function(langKey, $event) {
        // set the current lang
        $scope.selectLang = $scope.langs[langKey];
        // You can change the language during runtime
        $translate.use(langKey);
        $scope.lang.isopen = !$scope.lang.isopen;
      };

      function loadOrgs() {
        CfService.getOrgs().then(function(orgs) {
          if (orgs.status == 200) {
            $scope.organizations = orgs.data.resources;
            loadSpaces($scope.organizations[0].metadata.guid);
          }
        });
      }

      function loadSpaces(orgId) {
        var user = $rootScope.currentUser;
        CfService.getSpaces(orgId).then(function(spaces) {
          if (spaces.status == 200) {
            $rootScope.spaces = spaces.data.resources;
          }
        });
      }

      function isSmartDevice( $window )
      {
          // Adapted from http://www.detectmobilebrowsers.com
          var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
          // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
          return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
      }

  }]);
