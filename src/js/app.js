'use strict';

angular.module('app', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngTouch',
    'ngStorage',
    'ui.router',
    'ui.bootstrap',
    'ui.load',
    'ui.jq',
    'ui.validate',
    'oc.lazyLoad',
    'pascalprecht.translate',
    'angularUtils.directives.dirPagination',
    'luegg.directives',
    'd3',
    'd3.directives'
]);


angular.module('d3', ['app']);
angular.module('d3.directives', ['d3']);
