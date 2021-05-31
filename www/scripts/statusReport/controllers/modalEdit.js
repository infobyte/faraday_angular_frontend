// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information

angular.module('faradayApp')
    .controller('modalEditCtrl', [
        '$modalInstance',
        '$routeParams',
        'EASEOFRESOLUTION',
        'STATUSES',
        'commonsFact',
        'BASEURL',
        'severities',
        'vuln',
        'vulnModelsManager',
        'vulnsManager',
        'referenceFact',
        'encodeURIComponentFilter',
        'customFields',
        'workspace',
        'updateVulnAttachments',
        function ($modalInstance,
                  $routeParams,
                  EASEOFRESOLUTION,
                  STATUSES,
                  commonsFact,
                  BASEURL,
                  severities,
                  vuln,
                  vulnModelsManager,
                  vulnsManager,
                  referenceFact,
                  encodeURIComponent,
                  customFields,
                  workspace,
                  updateVulnAttachments) {

                var vm = this;

                vm.baseurl;
                vm.saveAsModelDisabled = false;
                vm.easeofresolution;
                vm.new_ref;
                vm.new_policyviolation;
                vm.icons;
                vm.cweList;
                vm.cweLimit;
                vm.cwe_filter;

                vm.file_name_error;

                vm.data;
                vm.vuln;

                init = function () {
                    vm.modelMessage = "Click here."
                    vm.easeofresolution = EASEOFRESOLUTION;
                    vm.severities = severities;
                    vm.statuses = STATUSES;
                    vm.new_ref = "";
                    vm.new_policyviolation = "";
                    vm.icons = {};
                    vm.baseurl = BASEURL;

                    vm.cweList = [];
                    vulnModelsManager.get().then(function (data) {
                        vm.cweList = data;
                    });
                    vm.cweLimit = 5;
                    vm.cwe_filter = "";

                    vm.file_name_error = false;

                    vm.customFields = customFields;
                    vm.workspace = workspace;

                    vm.data = {
                        _id: undefined,
                        _attachments: {},
                        confirmed: false,
                        data: "",
                        desc: "",
                        easeofresolution: undefined,
                        impact: {
                            accountability: false,
                            availability: false,
                            confidentiality: false,
                            integrity: false
                        },
                        name: "",
                        refs: {},
                        resolution: "",
                        severity: undefined,
                        method: "",
                        path: "",
                        status_code: undefined,
                        pname: "",
                        params: "",
                        query: "",
                        request: "",
                        response: "",
                        type: "Vulnerability",
                        website: "",
                        status: "opened",
                        policyviolations: [],
                        custom_fields:{},
			external_id: ""
                    };

                    vm.vuln = angular.copy(vuln);

                    vm.populate(vm.vuln);

                    // TODO: EVIDENCE SHOUD BE LOADED ALREADY?
                    if (vm.vuln._attachments !== undefined) {
                        updateVulnAttachments(vm.vuln._id).then(attachments => {
                            vm.vuln._attachments = attachments;
                            vm.data._attachments = attachments;
                            vm.icons = commonsFact.loadIcons(vm.data._attachments);
                        })
                    }

                    angular.element('#nav-tabs-container a[data-target="#general"]').click();
                };

                vm.saveAsModel = function () {
                    vm.modelMessage = "Done."
                    vm.vulnModelsManager.create(vm.data);
                    vm.saveAsModelDisabled = true;
                };

                vm.selectedFiles = function (files, e) {
                    files.forEach(function (file) {
                        file.newfile = true;
                        if (file.name.charAt(0) != "_") {
                            if (!vm.data._attachments.hasOwnProperty(file)) {
                                var fileName = file.name.replace(/ /g, '_');
                                vm.data._attachments[fileName] = file;
                            }
                        } else {
                            vm.file_name_error = true;
                        }
                    });
                    vm.icons = commonsFact.loadIcons(vm.data._attachments);
                }

                vm.removeEvidence = function (name) {
                    delete vm.data._attachments[name];
                    delete vm.icons[name];
                };

                vm.toggleImpact = function (key) {
                    vm.data.impact[key] = !vm.data.impact[key];
                };

                vm.ok = function () {
                    // add the ref in new_ref, if there's any
                    vm.newReference();
                    // convert refs to an array of strings
                    var refs = [];
                    vm.data.refs.forEach(function (ref) {
                        refs.push(ref.value);
                    });
                    vm.data.refs = refs;

                    // add the policy violation in new_policyviolation, if there's any
                    vm.newPolicyViolation();
                    // convert policy violations to an array of strings
                    var policyviolations = [];
                    vm.data.policyviolations.forEach(function (policyviolation) {
                        policyviolations.push(policyviolation.value);
                    });
                    vm.data.policyviolations = policyviolations;

                    vulnsManager.updateVuln(vm.vuln, vm.data).then(function () {
                        $modalInstance.close(vm.data);
                    }, function (data) {
                        commonsFact.showMessage("Error updating vuln " + vm.vuln.name + " (" + vm.vuln._id + "): " + (data.message || JSON.stringify(data.messages)));
                    });


                };

                vm.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };

                vm.newReference = function () {
                    if (vm.new_ref != "") {
                        // we need to check if the ref already exists
                        if (vm.data.refs.filter(function (ref) {
                                return ref.value === vm.new_ref
                            }).length == 0) {
                            vm.data.refs.push({value: vm.new_ref});
                            vm.new_ref = "";
                        }
                    }
                };

                vm.openReference = function (text) {
                    window.open(referenceFact.processReference(text), '_blank');
                };

                vm.openEvidence = function (name) {
                    var currentEvidence = vm.data._attachments[name];
                    if (!currentEvidence.newfile)
                        window.open(vm.baseurl + '_api/v3/ws/' + $routeParams.wsId + '/vulns/' + vm.data._id + '/attachment/' + encodeURIComponent(name), '_blank');
                };

                vm.newPolicyViolation = function () {
                    if (vm.new_policyviolation != "") {
                        // we need to check if the policy violation already exists
                        if (vm.data.policyviolations.filter(function (policyviolation) {
                                return policyviolation.value === vm.new_policyviolation
                            }).length == 0) {
                            vm.data.policyviolations.push({value: vm.new_policyviolation});
                            vm.new_policyviolation = "";
                        }
                    }
                };

                vm.populate = function (item) {
                    for (var key in vm.data) {
                        if (key != "refs" && key != "policyviolations" && item.hasOwnProperty(key) && vm.data.hasOwnProperty(key)) {
                            vm.data[key] = item[key];
                        }
                    }
                    // convert refs to an array of objects
                    var refs = [];
                    item.refs.forEach(function (ref) {
                        refs.push({value: ref});
                    });
                    vm.data.refs = refs;

                    // convert policyviolations to an array of objects
                    var policyviolations = [];
                    item.policyviolations.forEach(function (policyviolation) {
                        policyviolations.push({value: policyviolation});
                    });
                    vm.data.policyviolations = policyviolations;

                    if(item.customfields){
                        for(var cf in item.customfields){
                            vm.data.custom_fields[cf] = item.customfields[cf];
                        }
                    }
                };


                vm.updateBtnSeverityColor = function (severity) {
                    var color = undefined;
                    switch (severity) {
                        case "unclassified":
                            color = '#999999';
                            break;
                        case "info":
                            color = '#2e97bd';
                            break;
                        case "low":
                            color = '#a1ce31';
                            break;
                        case "med":
                            color = '#dfbf35';
                            break;
                        case "high":
                            color = '#df3936';
                            break;
                        case "critical":
                            color = '#932ebe';
                            break;
                    }

                    angular.element('#btn-chg-severity').css('background-color', color);
                    angular.element('#caret-chg-severity').css('background-color', color);
                };

                vm.changeSeverity = function (severity) {
                    vm.data.severity = severity;
                    vm.updateBtnSeverityColor(severity);
                };

                vm.updateBtnStatusColor = function (status) {
                    var color = undefined;
                    switch (status) {
                        case "opened":
                            color = '#DB3130';
                            break;
                        case "closed":
                            color = '#97F72C';
                            break;
                        case "re-opened":
                            color = '#DBB72F';
                            break;
                        case "risk-accepted":
                            color = '#288DB4';
                            break;
                        default:
                            color = '#aaaaaa';
                            break;
                    }

                    angular.element('#btn-chg-status').css('background-color', color);
                    angular.element('#caret-chg-status').css('background-color', color);
                };

                vm.changeStatus = function (status) {
                    vm.data.status = status;
                    vm.updateBtnStatusColor(status);
                };


                init();
            }])
;
