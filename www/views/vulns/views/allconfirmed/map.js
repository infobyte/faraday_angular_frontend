// Faraday Penetration Test IDE
// Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
// See the file 'doc/LICENSE' for the license information
function(doc) {
    if((doc.type == "Vulnerability" || doc.type == "VulnerabilityWeb") && doc.confirmed) {
        var easeofresolution = "",
        impact = {
            "accountability": false,
            "availability": false,
            "confidentiality": false,
            "integrity": false
        },
        resolution = "",
        confirmed = false;
        if(doc.easeofresolution !== undefined) {
            easeofresolution = doc.easeofresolution;
        }
        if(doc.impact !== undefined) {
            impact = doc.impact;
        }
        if(doc.resolution !== undefined) {
            resolution = doc.resolution;
        }

        var obj = {
            "_id":              doc._id,
            "_rev":             doc._rev,
            "_attachments":     doc._attachments,
            "confirmed":        doc.confirmed || confirmed,
            "data":             doc.data,
            "desc":             doc.desc, 
            "easeofresolution": easeofresolution,
            "impact":           impact,
            "metadata":         doc.metadata,
            "name":             doc.name, 
            "obj_id":           doc.obj_id,
            "owned":            doc.owned,
            "owner":            doc.owner,
            "parent":           doc.parent, 
            "refs":             doc.refs,
            "resolution":       resolution,
            "severity":         doc.severity, 
            "type":             doc.type,
        };

        if(doc.type == "VulnerabilityWeb") {
            obj.method =       	doc.method;
            obj.params =       	doc.params;
            obj.path =         	doc.path;
            obj.pname =        	doc.pname;
            obj.query =        	doc.query;
            obj.request =      	doc.request;
            obj.response =     	doc.response;
            obj.website =      	doc.website;
        }

        emit(doc._id, obj);
    }
}
