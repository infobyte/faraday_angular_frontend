// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information

angular.module('faradayApp')
    .controller('newHostCtrl', ['$scope', '$routeParams', 'workspacesFact',
                                '$uibModal', 'hostsManager', 'commonsFact', '$location',
            function($scope, $routeParams, workspacesFact, $uibModal, hostsManager,
                     commons, $location){

        init = function(){
            $scope.workspace = $routeParams.wsId;
            $scope.editing = true;
            $scope.showServices = false;
            $scope.creating = true;

            $scope.host = {
                "ip": "",
                "hostnames": [{key: ''}],
                "mac": "00:00:00:00:00:00",
                "description": "",
                "default_gateway": "None",
                "os": "",
                "owned": false,
                "owner": "",
            };

            // load all workspaces
            workspacesFact.list()
                .then(function(wss) {
                    $scope.workspaces = wss;
                });

            $scope.newHostnames = function($event){
                $scope.host.hostnames.push({key:''});
                $event.preventDefault();
            };

            $scope.insert = function(hostdata) {
                // The API expects list of strings in hostnames
                var old_hostnames = $scope.host.hostnames;
                $scope.host.hostnames = $scope.host.hostnames.map(function(hostname){
                    return hostname.key
                }).filter(Boolean);

                hostsManager.createHost(hostdata, $scope.workspace).then(function(host) {
                    $scope.host.hostnames = old_hostnames;
                    $location.path('/host/ws/' + $scope.workspace + '/hid/' + host.data.id);
                }, function(message) {
                    $scope.host.hostnames = old_hostnames;
                    $uibModal.open({
                        templateUrl: 'scripts/commons/partials/modalKO.html',
                        controller: 'commonsModalKoCtrl',
                        size: 'sm',
                        resolve: {
                            msg: function() {
                                return message;
                            }
                        }
                    });
                });
            };

            $scope.ok = function(){
                $scope.insert($scope.host);
            };


        };

        init();

    }]);

