// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information

angular.module('faradayApp')
    .controller('indexCtrl',
        ['$scope', '$uibModal', 'indexFact', 'BASEURL',
        function($scope, $uibModal, indexFact, BASEURL) {
        	indexFact.getConf().then(function(conf) {
                $scope.version = conf.data.ver;
                // check if we are in the correct frontend
                var version_indicator = conf.data.ver.substring(0,1);
                if (version_indicator !== 'p'){
                    return $location.path('/wrong_branch');
                }
                var osint = conf.data.osint;
                osint.prefix = osint.prefix || "/search?query=";
                osint.suffix = osint.suffix || "";
                if(!osint.use_external_icon)
                    osint.icon = "images/" + osint.icon + ".png";
                $scope.osint = osint;
        	});

            $scope.about = function() {
                $scope.base_url = BASEURL;
                var modal = $uibModal.open({
                    templateUrl: 'scripts/commons/partials/modalAbout.html',
                    scope: $scope
                });
            };

        }]);
