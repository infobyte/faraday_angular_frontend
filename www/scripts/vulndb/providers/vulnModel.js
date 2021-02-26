// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information

angular.module('faradayApp').
    factory('VulnModel', ['BASEURL', 'configSrv', 'ServerAPI', '$http', '$q',
        function(BASEURL, configSrv, ServerAPI, $http, $q) {
            function VulnModel(data) {
                this._id = "";
                this.id = "";
                this._rev = "";
                this.cwe = "";
                this.description = "";
                this.desc = "";
                this.data = "";
                this.exploitation = "";
                this.name = "";
                this.references = [];
                this.refs = [];
                this.data = "";
                this.resolution = "";
                this.impact =  {
                    accountability: false,
                    availability: false,
                    confidentiality: false,
                    integrity: false
                };
                this.policyviolations = [];
                this.customfields = [];
                this.easeofresolution = "";
                this.external_id = "";
                this.creator = "";
                this.create_at = "";
                if (data) {
                    if(data.name === undefined || data.name === "") {
                        throw new Error("Unable to create a Vulnerability Model whithout a name");
                    }
                    this.set(data);
                }
            };

            VulnModel.prototype = {

                public_properties: ['exploitation', 'references', 'name', 'resolution', 'cwe', 'description',
                                    'desc', 'data', 'id', 'refs', 'impact', 'easeofresolution', 'policyviolations', 'customfields',
				    'external_id', 'creator', 'create_at'],

                set: function(data) {
                    var self = this;

                    if(data._id != undefined) {
                        self._id = data._id;
                        self.id = data._id;
                        if(data._rev !== undefined) {
                            self._rev = data._rev;
                        };
                    }

                    self.public_properties.forEach(function(property) {
                        if(data[property] !== undefined) {
                            self[property] = data[property];
                        };
                    });
                },

                remove: function() {
                    var deferred = $q.defer();
                    var self = this;

                    ServerAPI.deleteVulnerabilityTemplate(self._id)
                        .then(function(resp) {
                            deferred.resolve(resp);
                        }, function(data, status, headers, config) {
                            deferred.reject("Unable to delete Vuln Model from DB. " + status)
                    });

                    return deferred.promise;
                },

                update: function(data) {
                    var deferred = $q.defer();
                    var self = this;

                    ServerAPI.updateVulnerabilityTemplate(data)
                        .then(function(res) {
                            self.set(res.data);
                            deferred.resolve(self);
                        }, function(res) {
                            deferred.reject("Unable to update the Vuln Model. " + JSON.stringify(res.data));
                    });
                    return deferred.promise;
                },

                save : function() {
                    var self = this;
                    var deferred = $q.defer();

                    delete this._id;
                    delete this._rev;

                    ServerAPI.createVulnerabilityTemplate(self)
                        .then(function(data) {
                            self._id = data.id;
                            self._rev = data.rev;
                            deferred.resolve(self);
                        }, function(res) {
                            try {
                                var msg = '';
                                for(var item in res.data.messages) {
                                    if(res.data.messages.hasOwnProperty(item)) {
                                        msg += item.charAt(0).toUpperCase() + item.slice(1) + ": ";
                                        msg += res.data.messages[item][0];
                                    }
                                }
                                var message;
                                if (res.status == 409) {
                                    message = "Vulnerability template \"" + res.data.object.name +
                                              "\" already exists with vulnerability template ID: " + res.data.object.id;
                                } else {
                                    message = "Unable to save the Vuln Model. " + msg;
                                }
                                deferred.reject(message);
                            } catch(err) {
                                deferred.reject(err);
                            }
                        });
                    return deferred.promise;
                }
            };

            return VulnModel;
        }]);
