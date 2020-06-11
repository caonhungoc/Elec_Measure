#!/usr/bin/python3

import os
import re
import subprocess
import sys
import itertools

def get_interface_ipaddr(interface):
  proc = subprocess.Popen(f'ifconfig {interface} | grep inet | head -n 1',
    shell=True,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT)
  out, err = proc.communicate()
  ipaddr = re.search(r"inet\s((\d+\.){3}\d+)",out.decode())
  if ipaddr:
    return ipaddr.group(1)
  return None

def replace_ipaddr(ipaddr):
  path_prefixs = ['./views', './public/scripts','./', './public']
  check_files = ['index.ejs', 'socket.js', 'index.js', 'app.js']
  found_pattern = False

  for _file, _prefix in itertools.product(check_files, path_prefixs):
    checking_file = os.path.join(_prefix, _file)
    ipaddr_pattern = re.compile(r"(localhost|(\d+\.){3}\d+)")
    replica = []
    if os.path.exists(checking_file):
      with open(checking_file, 'r') as rf:
        for line in rf:
          pattern = ipaddr_pattern.search(line)
          if pattern:
            line = ipaddr_pattern.sub(ipaddr, line)
            found_pattern = True
          replica.append(line)

    if found_pattern:
      with open(checking_file, 'w') as wf:
        for line in replica:
          wf.write(line)
      return

if __name__ == "__main__":
  ipaddr = ""
  if re.match(r"(\d+\.){3}\d+", sys.argv[1]):
    ipaddr = sys.argv[1]
  else:
    ipaddr = get_interface_ipaddr(sys.argv[1])
  replace_ipaddr(ipaddr)
