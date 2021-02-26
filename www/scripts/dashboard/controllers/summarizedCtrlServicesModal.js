// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information

angular.module('faradayApp')
    .controller('summarizedCtrlServicesModal',
        ['$scope', '$modalInstance', 'dashboardSrv', 'workspace', 'host', 'osint', 'ServerAPI',
        function($scope, $modalInstance, dashboardSrv, workspace, host, osint, ServerAPI) {

            $scope.host = host
            $scope.sortField = 'port';
            $scope.sortReverse = false;
            $scope.osint = osint;
            $scope.workspace = workspace

            // toggles sort field and order
            $scope.toggleSort = function(field) {
                $scope.toggleSortField(field);
                $scope.toggleReverse();
            };

            // toggles column sort field
            $scope.toggleSortField = function(field) {
                $scope.sortField = field;
            };

            // toggle column sort order
            $scope.toggleReverse = function() {
                $scope.sortReverse = !$scope.sortReverse;
            }

            ServerAPI.getServicesByHost(workspace, host._id).then(function(response){
                $scope.name = host.name;
                $scope.services = response.data;
            });

            $scope.ok = function(){
                $modalInstance.close();
            }

    }]);
