#!/usr/bin/env python
# -*- coding: utf-8 -*-

'''
Faraday Penetration Test IDE
Copyright (C) 2013  Infobyte LLC (http://www.infobytesec.com/)
See the file 'doc/LICENSE' for the license information
'''
from __future__ import with_statement
from plugins import core
import re
import os
import sys
import random
import tempfile


try:
    import xml.etree.cElementTree as ET
    import xml.etree.ElementTree as ET_ORIG
    ETREE_VERSION = ET_ORIG.VERSION
except ImportError:
    import xml.etree.ElementTree as ET
    ETREE_VERSION = ET.VERSION

ETREE_VERSION = [int(i) for i in ETREE_VERSION.split(".")]

current_path = os.path.abspath(os.getcwd())

__author__ = "Morgan Lemarechal"
__copyright__ = "Copyright 2014, Faraday Project"
__credits__ = ["Morgan Lemarechal"]
__license__ = ""
__version__ = "1.0.0"
__maintainer__ = "Morgan Lemarechal"
__email__ = "morgl@infobytesec.com"
__status__ = "Development"


class SslcheckParser(object):
    """
    The objective of this class is to parse an xml file generated by the ssl-check tool.
    TODO: Handle errors.
    TODO: Test ssl-check output version. Handle what happens if the parser doesn't support it.
    TODO: Test cases.
    @param sslcheck_filepath A proper simple report generated by ssl-check
    """

    def __init__(self, output):
        self.hostinfo = {}
        self.result = {}
        tree = ET.parse(output)
        root = tree.getroot()
        for scan in root.findall(".//scan"):
            infos = {}
            for info in scan.attrib:
                infos[info] = scan.attrib[info]
            self.hostinfo[scan.attrib['host']] = infos

            item = {}
            for carac in scan:
                item[carac.tag] = carac.text
            self.result[scan.attrib['host']] = item


class SslcheckPlugin(core.PluginBase):
    """
    Example plugin to parse ssl-check output.
    """

    def __init__(self):
        core.PluginBase.__init__(self)
        self.id = "Sslcheck"
        self.name = "Sslcheck XML Output Plugin"
        self.plugin_version = "0.0.2"
        self.version = "0.30"
        self._completition = {
            "": "ssl-check [-h] [-r {key,ren,sign,serv,cyph,forw,heart,crime,all} [{key,ren,sign,serv,cyph,forw,heart,crime,all} ...]] -host HOST [-port PORT] [--xml] [--version]",
            "-h": "show this help message and exit",
            "-r": "store the scan(s) requested made by the users",
            "-host": "store the target's host address",
            "-port": "store the target's port",
            "--xml": "Enable the XML output",
            "--version": "Show program's version number and exit",
        }

        self.options = None
        self._current_output = None
        self.current_path = None
        self._command_regex = re.compile(
            r'^(sudo sslcheck|sslcheck|\.\/sslcheck).*?')

        global current_path
        self._output_file_path = os.path.join(self.data_path, "%s_%s_output-%s.xml" % (self.get_ws(),
                                                                                       self.id,
                                                                                       random.uniform(1, 10)))

    def canParseCommandString(self, current_input):
        if self._command_regex.match(current_input.strip()):
            return True
        else:
            return False

    def parseOutputString(self, output, debug=False):
        """
        This method will discard the output the shell sends, it will read it from
        the xml where it expects it to be present.
        NOTE: if 'debug' is true then it is being run from a test case and the
        output being sent is valid.
        """
        if debug:
            parser = SslcheckParser(self._output_file_path)
        else:

            if not os.path.exists(self._output_file_path):
                if output:
                    temp_file = tempfile.NamedTemporaryFile()
                    temp_file.write(output)
                    temp_file.flush()
                    self._output_file_path = temp_file.name
                else:
                    return False
            parser = SslcheckParser(self._output_file_path)
            # print parser.result
            # print parser.hostinfo
            for host in parser.result:
                h_id = self.createAndAddHost(host)
                if(re.match("(^[2][0-5][0-5]|^[1]{0,1}[0-9]{1,2})\.([0-2][0-5][0-5]|[1]{0,1}[0-9]{1,2})\.([0-2][0-5][0-5]|[1]{0,1}[0-9]{1,2})\.([0-2][0-5][0-5]|[1]{0,1}[0-9]{1,2})$", host)):
                    i_id = self.createAndAddInterface(h_id,
                                                      host,
                                                      ipv4_address=host,
                                                      hostname_resolution=parser.hostinfo[host]['hostname'])
                else:
                    i_id = self.createAndAddInterface(h_id,
                                                      host,
                                                      ipv6_address=host)

                s_id = self.createAndAddServiceToInterface(
                    h_id, i_id, "https", protocol="tcp", ports=int(parser.hostinfo[host]['port']))
                for carac in parser.result[host]:
                    if carac == "key" and int(parser.result[host][carac]) < 2048:
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "Public server key size", desc="Key size = {} bits (2048 bits recommended)".format(parser.result[host][carac]), severity=2)
                        continue
                    if carac == "renegotiation" and parser.result[host][carac] == "no":
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "Secure renegotiation", desc="Secure renegotiation disabled (recommended: enabled)", severity=1)
                        continue
                    if carac == "forward_secrecy" and parser.result[host][carac] == "no":
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "Forward Secrecy", desc="Forward secrecy disabled (recommended: enabled)", severity=1)
                        continue
                    if carac == "heartbeat" and parser.result[host][carac] == "yes":
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "Heartbleed", desc="Heartbeat enabled (recommended: disabled)", severity=4)
                        continue
                    if carac == "forward_secrecy" and parser.result[host][carac] == "no":
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "CRIME", desc="Potentially vulnerable to CRIME attack", severity=0)
                        continue
                    if parser.result[host][carac] == "insecure":
                        v_id = self.createAndAddVulnToService(h_id, s_id, "Cipher suite {}".format(
                            carac), desc="{} enabled (recommended: disabled)".format(parser.result[host][carac]), severity=1)
                        continue
                    if parser.result[host][carac] == "signature insecure":
                        v_id = self.createAndAddVulnToService(h_id, s_id, "Certificate signature cipher suite {}".format(parser.result[host][
                                                              carac]), desc="{} used (recommended: use a safer one as sha256WithRSAEncryption)".format(parser.result[host][carac]), severity=1)
                        continue
                    if (carac == "SSLv3" and parser.result[host][carac] == "yes"):
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "SSL3", desc="SSL3 enabled (recommended: disabled)\nSSL3 is broken and should not be used.", severity=2)
                        continue
                    if (carac == "TLSv1" and parser.result[host][carac] == "yes"):
                        v_id = self.createAndAddVulnToService(
                            h_id, s_id, "TLSv1.0", desc="TLSv1.0 enabled (recommended: disabled, and to use TLSv1.1 or TLSv1.2)", severity=1)
                        continue
                    if (carac == "TLSv1.1" and parser.result[host][carac] == "no") or (carac == "TLSv1.2" and parser.result[host][carac] == "no"):
                        v_id = self.createAndAddVulnToService(h_id, s_id, parser.result[host][
                                                              carac], desc="{} disabled (recommended: enabled)".format(parser.result[host][carac]), severity=1)
                        continue

        del parser

        return True

    xml_arg_re = re.compile(r"^.*(--xml\s*[^\s]+).*$")

    def processCommandString(self, username, current_path, command_string):
        """
        Adds the parameter to get output to the command string that the
        user has set.
        """

        arg_match = self.xml_arg_re.match(command_string)

        if arg_match is None:
            return "%s --xml %s" % (command_string, self._output_file_path)
        else:
            return re.sub(arg_match.group(1),
                          r"-xml %s" % self._output_file_path,
                          command_string)


def createPlugin():
    return SslcheckPlugin()

if __name__ == '__main__':
    parser = SslcheckParser(sys.argv[1])
    for item in parser.items:
        if item.status == 'up':
            print item
